import type { Denops } from "jsr:@denops/std@~7.4.0";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@~0.3.0-alpha.6";
import { ensure, is } from "jsr:@core/unknownutil@~4.3.0";
import * as path from "jsr:@std/path@~1.0.8";
import * as buffer from "jsr:@denops/std@~7.4.0/buffer";
import * as variable from "jsr:@denops/std@~7.4.0/variable";
import * as option from "jsr:@denops/std@~7.4.0/option";
import { TextLineStream } from "jsr:@std/streams@~1.0.1";
import { Filetype } from "./filetype.ts";
import { debounceWithAbort } from "../lib/debounce.ts";
import * as fn from "jsr:@denops/std@~7.4.0/function";
import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../lib/stream.ts";
import { getNewSessionId } from "../lib/session.ts";

type BufVars = { src_kind: string; src_name: string; session: string };

async function getBufVars(denops: Denops, bufnr: number): Promise<BufVars> {
  const get = async (name: string) =>
    ensure(await variable.b.get(denops, name), is.String);
  return await buffer.ensure(denops, bufnr, async () => {
    return {
      src_kind: await get("jqplay_src_kind"),
      src_name: await get("jqplay_src_name"),
      session: await get("jqplay_session"),
    };
  });
}

async function setBufVars(denops: Denops, bufnr: number, vars: BufVars) {
  await buffer.ensure(denops, bufnr, async () => {
    await variable.b.set(denops, "jqplay_src_kind", vars.src_kind);
    await variable.b.set(denops, "jqplay_src_name", vars.src_name);
    await variable.b.set(denops, "jqplay_session", vars.session);
  });
}

export async function loadQueryBuffer(denops: Denops, buf: Buffer) {
  const params = ensure(
    buf.bufname.params,
    is.ObjectOf({
      kind: is.LiteralOf("file"),
      name: is.String,
    }),
  );

  // set filetype
  await option.filetype.setBuffer(denops, buf.bufnr, Filetype.Query);

  // store params
  await setBufVars(denops, buf.bufnr, {
    src_kind: params.kind,
    src_name: params.name,
    session: await getNewSessionId(denops),
  });
}

async function processQueryCore(
  signal: AbortSignal,
  denops: Denops,
  router: Router,
  tempDir: string,
  queryBuf: Buffer,
) {
  const { src_name, session } = await getBufVars(denops, queryBuf.bufnr);

  if (signal.aborted) return;

  const filterPath = path.join(tempDir, session);
  const query = await fn.getbufline(denops, queryBuf.bufnr, 1, "$");
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
      args: ["--from-file", filterPath],
      cwd: await fn.getcwd(denops),
      signal: signal,
      stdin: "piped",
      stdout: "piped",
    },
  );
  const process = cmd.spawn();
  const source = await Deno.open(src_name, { read: true });
  await option.readonly.setBuffer(denops, outputBufnr, false);
  try {
    await Promise.all([
      process.status,
      source.readable.pipeTo(process.stdin),
      process.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new ChunkLinesTransformStream())
        .pipeTo(new BufferWritingStream(denops, outputBufnr)),
    ]);
  } finally {
    await option.readonly.setBuffer(denops, outputBufnr, true);
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
