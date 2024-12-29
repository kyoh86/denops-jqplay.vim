import type { Denops } from "jsr:@denops/std@7.4.0";
import type { Buffer, Router } from "jsr:@kyoh86/denops-router@0.3.7";
import * as path from "jsr:@std/path@1.0.8";
import * as option from "jsr:@denops/std@7.4.0/option";
import * as fn from "jsr:@denops/std@7.4.0/function";

import { Filetype } from "./filetype.ts";
import { type Context, type Flags, start } from "../../lib/jq.ts";
import { debounceWithAbort } from "../../lib/debounce.ts";
import { getBufVars, setBufVars } from "./bufvar.ts";
import { getNewSessionId } from "../../lib/session.ts";

export abstract class BaseHandler<TParams> {
  async load(denops: Denops, buf: Buffer) {
    await this.parseBufParams(denops, buf);

    // set filetype
    await option.filetype.setBuffer(denops, buf.bufnr, Filetype.Query);

    // store params
    await setBufVars(denops, buf.bufnr, {
      session: await getNewSessionId(denops),
    });
  }
  abstract parseBufParams(
    denops: Denops,
    buf: Buffer,
  ): Promise<{ flags: Flags; params: TParams }>;

  abstract processCore(
    denops: Denops,
    process: Deno.ChildProcess,
    params: TParams,
    outputBufnr: number,
  ): Promise<void>;

  getAdditionalContext(): Partial<Context> {
    return {};
  }

  async #process(
    signal: AbortSignal,
    denops: Denops,
    router: Router,
    tempDir: string,
    buf: Buffer,
  ) {
    const { session } = await getBufVars(denops, buf.bufnr);
    const params = await this.parseBufParams(denops, buf);

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

    try {
      const p = await start({
        denops,
        signal,
        fromFile: filter,
        ...this.getAdditionalContext(),
      }, params.flags);
      await this.processCore(denops, p, params.params, outputBufnr);
    } finally {
      await option.readonly.setBuffer(denops, outputBufnr, true);
    }
  }

  processor(): (
    denops: Denops,
    router: Router,
    tempDir: string,
    buf: Buffer,
  ) => void {
    return debounceWithAbort(this.#process.bind(this), 500);
  }
}
