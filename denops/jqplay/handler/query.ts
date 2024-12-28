import type { Denops } from "jsr:@denops/std@7.4.0";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@0.3.7";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import * as path from "jsr:@std/path@1.0.8";
import * as buffer from "jsr:@denops/std@7.4.0/buffer";
import * as variable from "jsr:@denops/std@7.4.0/variable";
import * as option from "jsr:@denops/std@7.4.0/option";
import * as fn from "jsr:@denops/std@7.4.0/function";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { TextLineStream } from "jsr:@std/streams@1.0.8";

import { Filetype } from "./filetype.ts";
import { debounceWithAbort } from "../lib/debounce.ts";
import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../lib/stream.ts";
import { getNewSessionId } from "../lib/session.ts";
import { type Context, type Flags, flagsSchema, start } from "../lib/jq.ts";
import { numeric } from "../types.ts";

type BufVars = { session: string };

type NullBufParams = { kind: "null" };

const nullBufParamsSchema = v.object({
  kind: v.literal("null"),
});

type BufferBufParams = { kind: "buffer"; source: string };

const bufferBufParamsSchema = (denops: Denops) =>
  v.objectAsync({
    kind: v.literal("buffer"),
    source: v.pipeAsync(
      v.string(),
      numeric,
      v.checkAsync(
        async (x) => await fn.bufloaded(denops, Number(x)),
        (x) => `buffer ${x.input} is not loaded`,
      ),
    ),
  });

type FileBufParams = { kind: "file"; source: string };

const fileBufParamsSchema = (denops: Denops) =>
  v.objectAsync({
    kind: v.literal("file"),
    source: v.pipeAsync(
      v.string(),
      v.checkAsync(
        async (x) => await fn.filereadable(denops, x) == 1,
        (x) => `file ${x.input} is not readable`,
      ),
    ),
  });

async function parseBufParams(
  denops: Denops,
  buf: Buffer,
): Promise<
  & Flags
  & (
    | NullBufParams
    | BufferBufParams
    | FileBufParams
  )
> {
  return await v.parseAsync(
    v.intersectAsync([
      flagsSchema,
      v.unionAsync([
        nullBufParamsSchema,
        bufferBufParamsSchema(denops),
        fileBufParamsSchema(denops),
      ]),
    ]),
    buf.bufname.params,
  );
}

async function getBufVars(denops: Denops, bufnr: number): Promise<BufVars> {
  const get = async (name: string) =>
    ensure(await variable.b.get(denops, name), is.String);
  return await buffer.ensure(denops, bufnr, async () => {
    return {
      session: await get("jqplay_session"),
    };
  });
}

async function setBufVars(denops: Denops, bufnr: number, vars: BufVars) {
  await buffer.ensure(denops, bufnr, async () => {
    await variable.b.set(denops, "jqplay_session", vars.session);
  });
}

export async function loadQueryBuffer(denops: Denops, buf: Buffer) {
  await parseBufParams(denops, buf);

  // set filetype
  await option.filetype.setBuffer(denops, buf.bufnr, Filetype.Query);

  // store params
  await setBufVars(denops, buf.bufnr, {
    session: await getNewSessionId(denops),
  });
}

async function processQueryCore(
  signal: AbortSignal,
  denops: Denops,
  router: Router,
  tempDir: string,
  buf: Buffer,
) {
  const { session } = await getBufVars(denops, buf.bufnr);
  const params = await parseBufParams(denops, buf);

  if (signal.aborted) return;

  const filter = path.join(tempDir, session);
  const query = await fn.getbufline(denops, buf.bufnr, 1, "$");
  await fn.writefile(denops, query, filter, "");

  if (signal.aborted) return;

  const bufname = await router.open(denops, "output", { session }, "", {
    split: "split-above",
    reuse: true,
  });
  const outputBufnr = await fn.bufnr(denops, bufname);
  await option.readonly.setBuffer(denops, outputBufnr, false);

  if (signal.aborted) return;

  const ctx: Context = {
    denops,
    signal,
    fromFile: filter,
    ...params.kind === "null" ? { nullInput: true } : {},
  };

  try {
    switch (params.kind) {
      case "null": {
        const { kind: _, ...flags } = params;
        const p = await start(ctx, flags);
        await processNull(denops, p, outputBufnr);
        break;
      }
      case "buffer": {
        const { kind: _, source, ...flags } = params;
        const p = await start(ctx, flags);
        await processBuf(denops, p, Number(source), outputBufnr);
        break;
      }
      case "file": {
        const { kind: _, source, ...flags } = params;
        const p = await start(ctx, flags);
        await processFile(denops, p, source, outputBufnr);
        break;
      }
    }
  } finally {
    await option.readonly.setBuffer(denops, outputBufnr, true);
  }
}

async function processNull(
  denops: Denops,
  process: Deno.ChildProcess,
  outputBufnr: number,
) {
  // stdoutの結果をoutputBufnrへ書き込み
  await Promise.all([
    process.status,
    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new ChunkLinesTransformStream())
      .pipeTo(new BufferWritingStream(denops, outputBufnr)),
  ]);
}

async function processBuf(
  denops: Denops,
  process: Deno.ChildProcess,
  inputBufnr: number,
  outputBufnr: number,
) {
  const lines = await fn.getbufline(denops, inputBufnr, 1, "$");

  // バッファ内容を改行で結合
  const inputText = lines.join("\n") + "\n";
  const encoder = new TextEncoder();
  const inputData = encoder.encode(inputText);

  // stdinへ一括書き込み
  const writer = process.stdin.getWriter();
  await writer.write(inputData);
  await writer.close();

  // stdoutの結果をoutputBufnrへ書き込み
  await Promise.all([
    process.status,
    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new ChunkLinesTransformStream())
      .pipeTo(new BufferWritingStream(denops, outputBufnr)),
  ]);
}

async function processFile(
  denops: Denops,
  process: Deno.ChildProcess,
  src: string,
  outputBufnr: number,
) {
  const file = await Deno.open(src, { read: true });
  try {
    await Promise.all([
      process.status,
      file.readable.pipeTo(process.stdin),
      process.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new ChunkLinesTransformStream())
        .pipeTo(new BufferWritingStream(denops, outputBufnr)),
    ]);
  } finally {
    file.close();
  }
}

const debouncedProcessQuery = debounceWithAbort(processQueryCore, 500);

export function processQuery(
  denops: Denops,
  router: Router,
  tempDir: string,
  buf: Buffer,
) {
  debouncedProcessQuery(denops, router, tempDir, buf);
}
