import type { Denops } from "jsr:@denops/std@7.4.0";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@0.3.3";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import * as path from "jsr:@std/path@1.0.8";
import * as buffer from "jsr:@denops/std@7.4.0/buffer";
import * as variable from "jsr:@denops/std@7.4.0/variable";
import * as option from "jsr:@denops/std@7.4.0/option";
import * as fn from "jsr:@denops/std@7.4.0/function";
import { TextLineStream } from "jsr:@std/streams@1.0.8";

import { Filetype } from "./filetype.ts";
import { debounceWithAbort } from "../lib/debounce.ts";
import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../lib/stream.ts";
import { getNewSessionId } from "../lib/session.ts";

type BufVars = { session: string };

async function parseBufParams(denops: Denops, buf: Buffer) {
  const kind = ensure(
    buf.bufname.params?.kind,
    is.UnionOf([is.LiteralOf("file"), is.LiteralOf("buffer")]),
    {
      message:
        `{kind} should be 'file' or 'buffer': ${buf.bufname.params?.kind}`,
    },
  );
  const sourceStr = ensure(
    buf.bufname.params?.source,
    is.String,
    {
      message: `{source} required`,
    },
  );
  switch (kind) {
    case "buffer": {
      const source = parseInt(sourceStr, 10);
      if (isNaN(source)) {
        throw new Error(
          `{source} should be a number: ${sourceStr}`,
        );
      }
      if (!await fn.bufloaded(denops, source)) {
        throw new Error(
          `buffer ${source} is not loaded`,
        );
      }
      return { kind, source };
    }
    case "file": {
      path.parse(sourceStr);
      if (!await fn.filereadable(denops, sourceStr)) {
        throw new Error(
          `file ${sourceStr} is not readable`,
        );
      }
      return { kind, source: path.normalize(sourceStr) };
    }
  }
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
  const { session } = await getBufVars(
    denops,
    buf.bufnr,
  );
  const params = await parseBufParams(denops, buf);

  if (signal.aborted) return;

  const filterPath = path.join(tempDir, session);
  const query = await fn.getbufline(denops, buf.bufnr, 1, "$");
  await fn.writefile(denops, query, filterPath, "");

  if (signal.aborted) return;

  const bufname = await router.open(denops, "output", { session }, "", {
    split: "split-above",
    reuse: true,
  });
  const outputBufnr = await fn.bufnr(denops, bufname);

  if (signal.aborted) return;

  const cmd = new Deno.Command( // TODO: cofigurable command
    "jq",
    {
      args: [
        "--from-file",
        filterPath,
        "--monochrome-output",
        "--unbuffered",
        "--exit-status",
      ],
      cwd: await fn.getcwd(denops),
      signal: signal,
      stdin: "piped",
      stdout: "piped",
    },
  );
  const process = cmd.spawn();

  await option.readonly.setBuffer(denops, outputBufnr, false);
  try {
    switch (params.kind) {
      case "buffer":
        await processQueryBuffer(denops, process, params.source, outputBufnr);
        break;
      case "file":
        await processQueryFile(denops, process, params.source, outputBufnr);
        break;
    }
  } finally {
    await option.readonly.setBuffer(denops, outputBufnr, true);
  }
}

const debouncedProcessQuery = debounceWithAbort(processQueryCore, 500);

async function processQueryBuffer(
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

async function processQueryFile(
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

export function processQuery(
  denops: Denops,
  router: Router,
  tempDir: string,
  buf: Buffer,
) {
  debouncedProcessQuery(denops, router, tempDir, buf);
}
