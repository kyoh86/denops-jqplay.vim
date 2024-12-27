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

import {
  type FileParams,
  startFromFile,
  validateFileParams,
} from "./dispatch/file.ts";
import {
  type BufferParams,
  startFromBuffer,
  validateBufferParams,
} from "./dispatch/buffer.ts";
import {
  type NullParams,
  startFromNull,
  validateNullParams,
} from "./dispatch/null.ts";
import { loadQueryBuffer, processQuery } from "./handler/query.ts";
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
    null: async (uParams: unknown) => {
      await startFromNull(denops, router, v.parse(validateNullParams, uParams));
    },
    file: async (uParams: unknown) => {
      await startFromFile(denops, router, v.parse(validateFileParams, uParams));
    },
    buffer: async (uParams: unknown) => {
      await startFromBuffer(
        denops,
        router,
        v.parse(validateBufferParams, uParams),
      );
      return Promise.resolve(uParams);
    },
  };
  const bound = bindDispatcher(raw, new ParamStore(), "");
  denops.dispatcher = await router.dispatch(denops, {
    ...bound,
    "command:null": async (uArgs: unknown) => {
      const [_, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
      const { split, ...flags } = v.parse(
        v.intersect([validateJqParams, validateBufferOpener]),
        uFlags,
      );
      flags satisfies Partial<NullParams>;
      await bound.null({ split, ...flags });
    },
    "command:file": async (uArgs: unknown) => {
      const [_, uFlags, srcs] = parse(ensure(uArgs, is.ArrayOf(is.String)));
      const { split, ...flags } = v.parse(
        v.intersect([validateJqParams, validateBufferOpener]),
        uFlags,
      );
      flags satisfies Partial<FileParams>;
      switch (srcs.length) {
        case 0: {
          console.error(":JqplayFile needs a file name");
          return;
        }
        case 1: {
          break;
        }
        default: {
          console.error(":JqplayFile can accept only one file name");
          return;
        }
      }
      const source = await fnamemodify(denops, srcs[0], "p");
      await bound.file({ source, split, ...flags });
    },
    "command:buffer": async (uArgs: unknown) => {
      const [_, uFlags, srcs] = parse(ensure(uArgs, is.ArrayOf(is.String)));
      let bufnr = 0;
      switch (srcs.length) {
        case 0: {
          bufnr = await fn.bufnr(denops);
          break;
        }
        case 1: {
          bufnr = Number(srcs[0]);
          if (isNaN(bufnr)) {
            bufnr = await fn.bufnr(denops, srcs[0]);
          }
          break;
        }
        default: {
          console.error(":JqplayBuffer can accept only one buffer name");
          return;
        }
      }
      const { split, ...flags } = v.parse(
        v.intersect([validateJqParams, validateBufferOpener]),
        uFlags,
      );
      flags satisfies Partial<BufferParams>;

      await bound.buffer({ bufnr, split, ...flags });
    },
  });
};
