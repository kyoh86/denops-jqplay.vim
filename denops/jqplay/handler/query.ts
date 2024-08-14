import type { Denops } from "jsr:@denops/std@~7.0.1";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@~0.2.0";
import { ensure, is } from "jsr:@core/unknownutil@~4.2.0";
import * as buffer from "jsr:@denops/std@~7.0.1/buffer";
import * as variable from "jsr:@denops/std@~7.0.1/variable";
import * as option from "jsr:@denops/std@~7.0.1/option";
import { v1 as uuid } from "jsr:@std/uuid@~1.0.0";
import { TextLineStream } from "jsr:@std/streams@~1.0.1";
import { Filetype } from "./filetype.ts";
import { debounceWithAbort } from "../lib/debounce.ts";
import { bufnr, getbufline, getcwd } from "jsr:@denops/std@~7.0.1/function";
import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../lib/stream.ts";

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
  await buffer.ensure(denops, buf.bufnr, async () => {
    await option.filetype.setLocal(denops, Filetype.Query);
  });

  // store params
  await setBufVars(denops, buf.bufnr, {
    src_kind: params.kind,
    src_name: params.name,
    session: uuid.generate(),
  });
}

async function processQueryCore(
  signal: AbortSignal,
  denops: Denops,
  router: Router,
  queryBuf: Buffer,
) {
  const { src_name, session } = await getBufVars(denops, queryBuf.bufnr);

  if (signal.aborted) return;

  const query = await getbufline(denops, queryBuf.bufnr, 1, "$");

  if (signal.aborted) return;

  const outputBufname = await router.drop(denops, "output", "horizontal", {
    session,
  });
  const outputBufnr = await bufnr(denops, outputBufname);

  if (signal.aborted) return;

  const cmd = new Deno.Command( // TODO: cofigurable command
    "jq",
    {
      args: [query.join("\n").trim()],
      cwd: await getcwd(denops),
      signal: signal,
      stdin: "piped",
      stdout: "piped",
    },
  );
  const process = cmd.spawn();
  const source = await Deno.open(src_name, { read: true });
  await Promise.all([
    process.status,
    source.readable.pipeTo(process.stdin),
    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new ChunkLinesTransformStream())
      .pipeTo(new BufferWritingStream(denops, outputBufnr)),
  ]);
}

const debouncedProcessQuery = debounceWithAbort(processQueryCore, 500);

export function processQuery(
  denops: Denops,
  router: Router,
  buf: Buffer,
) {
  debouncedProcessQuery(denops, router, buf);
}
