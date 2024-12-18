import type { Entrypoint } from "jsr:@denops/core@~7.0.0";
import { bindDispatcher } from "jsr:@kyoh86/denops-bind-params@~0.0.2";
import { ensure, is } from "jsr:@core/unknownutil@~4.3.0";
import { parse } from "jsr:@denops/std@~7.4.0/argument";
import { type Buffer, Router } from "jsr:@kyoh86/denops-router@~0.3.0-alpha.6";
import { fnamemodify } from "jsr:@denops/std@~7.4.0/function";

import { isPlayParams, play } from "./command/play.ts";
import { loadQueryBuffer, processQuery } from "./handler/query.ts";

export const main: Entrypoint = async (denops) => {
  const tempDir = await Deno.makeTempDir({ prefix: "denops-jqplay.vim" });
  const router = new Router("jqplay");
  router.handle("query", {
    load: async (buf: Buffer) => {
      await loadQueryBuffer(denops, buf);
    },
    save: (buf: Buffer) => {
      processQuery(denops, router, tempDir, buf);
      return Promise.resolve();
    },
  });

  router.handle("output", {
    load: async (_buf: Buffer) => {},
  });

  const bound = bindDispatcher({ // bind params for each entrypoint
    play: async (uParams: unknown) => {
      return await play(denops, router, ensure(uParams, isPlayParams));
    },
  });

  denops.dispatcher = await router.dispatch(denops, {
    ...bound,
    "command:play": async (uMods: unknown, uArgs: unknown) => {
      const [_uOpts, _uFlags, uResidues] = parse(
        ensure(uArgs, is.ArrayOf(is.String)),
      );
      const mods = ensure(uMods, is.String);
      const files = ensure(uResidues, is.ArrayOf(is.String));
      const file = await bound.play({
        mods,
        file: await fnamemodify(denops, files[0], "p"),
      });
      if (!file) {
        return;
      }
    },
  });
};
