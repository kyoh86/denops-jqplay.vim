import type { Entrypoint } from "jsr:@denops/core@7.0.1";
import {
  bindDispatcher,
  ParamStore,
} from "jsr:@kyoh86/denops-bind-params@^0.0.4-alpha.2";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.4.0/argument";
import {
  type Buffer,
  Router,
  validateBufferOpener,
} from "jsr:@kyoh86/denops-router@0.3.6";
import { fnamemodify } from "jsr:@denops/std@7.4.0/function";
import * as fn from "jsr:@denops/std@7.4.0/function";
import * as v from "jsr:@valibot/valibot@0.42.1";

import { file, validateFileParams } from "./dispatch/file.ts";
import { loadQueryBuffer, processQuery } from "./handler/query.ts";
import {
  buffer,
  type BufferParams,
  validateBufferParams,
} from "./dispatch/buffer.ts";
import type { FileParams } from "./dispatch/file.ts";
import { validateJqParams } from "./types.ts";

export const main: Entrypoint = async (denops) => {
  const tempDir = await Deno.makeTempDir({ prefix: "denops-jqplay.vim" });
  const router = new Router("jqplay");
  router.addHandler("query", {
    load: async (buf: Buffer) => {
      await loadQueryBuffer(denops, buf);
    },
    save: (buf: Buffer) => {
      processQuery(denops, router, tempDir, buf);
      return Promise.resolve();
    },
  });

  router.addHandler("output", {
    load: async (_buf: Buffer) => {},
  });
  const raw = { // bind params for each entrypoint
    file: async (uParams: unknown) => {
      await file(denops, router, v.parse(validateFileParams, uParams));
    },
    buffer: async (uParams: unknown) => {
      await buffer(denops, router, v.parse(validateBufferParams, uParams));
      return Promise.resolve(uParams);
    },
  };
  const bound = bindDispatcher(raw, new ParamStore(), "");
  denops.dispatcher = await router.dispatch(denops, {
    ...bound,
    "command:start": async (uArgs: unknown) => {
      const [_uOpts, uFlags, uResidues] = parse(
        ensure(uArgs, is.ArrayOf(is.String)),
      );
      const sources = ensure(uResidues, is.ArrayOf(is.String));
      switch (sources.length) {
        case 0: {
          const { bufnr, split, ...flags } = v.parse(
            v.intersect([
              v.object({ bufnr: v.optional(v.number()) }),
              validateJqParams,
              validateBufferOpener,
            ]),
            uFlags,
          );
          flags satisfies Partial<BufferParams>;

          await bound.buffer({
            bufnr: bufnr ? Number(bufnr) : await fn.bufnr(denops),
            split,
            ...flags,
          });
          break;
        }
        case 1: {
          const { split, ...flags } = v.parse(
            v.intersect([
              validateJqParams,
              validateBufferOpener,
            ]),
            uFlags,
          );
          flags satisfies Partial<FileParams>;

          await bound.file({
            source: await fnamemodify(denops, sources[0], "p"),
            split,
            ...flags,
          });
          break;
        }
        default:
          console.error("invalid: :Jqplay can accept only one file at once");
          break;
      }
    },
  });
};
