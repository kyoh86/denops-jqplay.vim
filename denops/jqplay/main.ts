import type { Denops, Entrypoint } from "jsr:@denops/core@7.0.1";
import {
  bindDispatcher,
  ParamStore,
} from "jsr:@kyoh86/denops-bind-params@^0.0.4-alpha.2";
import { ensure, is, maybe } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.4.0/argument";
import * as vr from "jsr:@denops/std@7.4.0/variable";
import {
  type Buffer,
  bufferOpenerSchema,
  Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import { fnamemodify } from "jsr:@denops/std@7.4.0/function";
import * as fn from "jsr:@denops/std@7.4.0/function";
import * as v from "jsr:@valibot/valibot@0.42.1";

import {
  type FileParams,
  fileParamsSchema,
  startFromFile,
} from "./dispatch/file.ts";
import {
  type BufferParams,
  bufferParamsSchema,
  startFromBuffer,
} from "./dispatch/buffer.ts";
import {
  type NullParams,
  nullParamsSchema,
  startFromNull,
} from "./dispatch/null.ts";
import { loadQueryBuffer, processQuery } from "./handler/query.ts";
import { flagsSchema } from "./lib/jq.ts";

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
      await startFromNull(denops, router, v.parse(nullParamsSchema, uParams));
    },
    file: async (uParams: unknown) => {
      await startFromFile(denops, router, v.parse(fileParamsSchema, uParams));
    },
    buffer: async (uParams: unknown) => {
      await startFromBuffer(
        denops,
        router,
        v.parse(bufferParamsSchema, uParams),
      );
      return Promise.resolve(uParams);
    },
  };
  const bound = bindDispatcher(raw, new ParamStore(), "");
  denops.dispatcher = await router.dispatch(denops, {
    ...bound,
    "command:null": catchError(
      denops,
      async (uArgs: unknown) => {
        const [_, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
        const { split, ...flags } = v.parse(
          v.intersect([flagsSchema, bufferOpenerSchema]),
          uFlags,
        );
        flags satisfies Partial<NullParams>;
        await bound.null({ split, ...flags });
      },
    ),
    "command:file": catchError(
      denops,
      async (uArgs: unknown) => {
        const [_, uFlags, srcs] = parse(ensure(uArgs, is.ArrayOf(is.String)));
        const { split, ...flags } = v.parse(
          v.intersect([flagsSchema, bufferOpenerSchema]),
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
    ),
    "command:buffer": catchError(
      denops,
      async (uArgs: unknown) => {
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
          v.intersect([flagsSchema, bufferOpenerSchema]),
          uFlags,
        );
        flags satisfies Partial<BufferParams>;

        await bound.buffer({ bufnr, split, ...flags });
      },
    ),
  });
};

type Fn = (...args: unknown[]) => Promise<void> | void;

export function catchError(denops: Denops, fn: Fn): Fn {
  return async (...args: unknown[]) => {
    try {
      const x = fn(...args);
      if (x instanceof Promise) {
        return x.catch((e) => showError(denops, e));
      }
      return x;
    } catch (e) {
      await showError(denops, e);
    }
  };
}

async function showError(denops: Denops, e: unknown): Promise<void> {
  const err = denops.meta.mode === "release" &&
      await vr.g.get(denops, "jqplay#debug", 0) === 0
    ? maybe(e, is.ObjectOf({ message: is.String }))
    : undefined;
  if (err) {
    console.error(err.message);
  } else {
    console.error(e);
  }
}
