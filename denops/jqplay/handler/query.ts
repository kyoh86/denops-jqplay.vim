import type { Denops } from "jsr:@denops/std@~7.0.1";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@~0.2.0";
import { ensure, is } from "jsr:@core/unknownutil@~4.2.0";
import * as buffer from "jsr:@denops/std@~7.0.1/buffer";
import * as variable from "jsr:@denops/std@~7.0.1/variable";
import * as option from "jsr:@denops/std@~7.0.1/option";
import { NAMESPACE_URL, v5 as uuid } from "jsr:@std/uuid@~1.0.0";
import { TextLineStream } from "jsr:@std/streams@~1.0.1";
import { Filetype } from "./filetype.ts";
import { debounceWithAbort } from "../lib/debounce.ts";
import { bufnr, getbufline, getcwd } from "jsr:@denops/std@~7.0.1/function";

export async function loadQueryBuffer(
  denops: Denops,
  router: Router,
  buf: Buffer,
) {
  const params = ensure(
    buf.bufname.params,
    is.ObjectOf({
      kind: is.LiteralOf("file"),
      name: is.String,
    }),
  );

  const session = await uuid.generate(
    NAMESPACE_URL,
    new TextEncoder().encode(params.name),
  );

  // store params
  await buffer.ensure(denops, buf.bufnr, async () => {
    await option.filetype.setLocal(denops, Filetype.Query);
    await option.modifiable.setLocal(denops, true);
    await variable.b.set(denops, "jqplay_source_kind", params.kind);
    await variable.b.set(denops, "jqplay_source_name", params.name);
    await variable.b.set(denops, "jqplay_session", session);
  });

  // create new buffer to output
  await router.preload(denops, "output", { session });
}

async function processQueryCore(
  signal: AbortSignal,
  denops: Denops,
  router: Router,
  queryBuf: Buffer,
) {
  const { source_name, session } = await buffer.ensure(
    denops,
    queryBuf.bufnr,
    async () => {
      const source_kind = ensure(
        await variable.b.get(denops, "jqplay_source_kind"),
        is.String,
      );
      const source_name = ensure(
        await variable.b.get(denops, "jqplay_source_name"),
        is.String,
      );
      const session = ensure(
        await variable.b.get(denops, "jqplay_session"),
        is.String,
      );
      return { source_kind, source_name, session };
    },
  );
  if (signal.aborted) {
    return;
  }

  const outputBufname = await router.drop(denops, "output", "horizontal", {
    session,
  });
  const outputBufnr = await bufnr(denops, outputBufname);
  await buffer.replace(denops, outputBufnr, ["Processing..."], {});

  const query = await getbufline(denops, 1, "$");
  const cmd = new Deno.Command( // TODO: cofigurable command
    "jq",
    {
      args: [query.join("\n")],
      cwd: await getcwd(denops),
      signal: signal,
      stdin: "piped",
      stdout: "piped",
    },
  );
  const process = cmd.spawn();
  const source = await Deno.open(source_name, { read: true });
  let lines: string[] = [];
  const chunkSize = 50;
  const chunks = new TransformStream<string, string[]>({
    transform(chunk, controller) {
      lines.push(chunk);
      if (lines.length > chunkSize) {
        controller.enqueue(lines);
        lines = [];
      }
    },
    flush(controller) {
      if (lines.length > 0) {
        controller.enqueue(lines);
      }
    },
  });
  let lnum = 0;
  const output = new WritableStream<string[]>({
    write: async (chunk, _controller) => {
      if (lnum == 0) {
        await buffer.replace(denops, outputBufnr, chunk, {});
      } else {
        await buffer.append(denops, outputBufnr, chunk, { lnum: lnum });
      }
      lnum += chunk.length;
    },
  });

  const { promise, resolve } = Promise.withResolvers<void>();
  signal.addEventListener("abort", () => resolve());

  await Promise.all([
    promise,
    source.readable.pipeTo(process.stdin),
    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(chunks)
      .pipeTo(output),
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
