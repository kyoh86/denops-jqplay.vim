import type { Denops, Entrypoint } from "jsr:@denops/std@8.0.0";
import {
  bindDispatcher,
  ParamStore,
} from "jsr:@kyoh86/denops-bind-params@^0.0.4-alpha.2";
import { is, maybe } from "jsr:@core/unknownutil@4.3.0";
import * as vr from "jsr:@denops/std@8.0.0/variable";
import { Router } from "jsr:@kyoh86/denops-router@0.5.0";

import { BufferHandler } from "./kind/buffer/handler.ts";
import { FileHandler } from "./kind/file/handler.ts";
import { EmptyHandler } from "./kind/empty/handler.ts";

import { start as startBuffer } from "./kind/buffer/start.ts";
import { start as startFile } from "./kind/file/start.ts";
import { start as startEmpty } from "./kind/empty/start.ts";

import { command as commandBuffer } from "./kind/buffer/command.ts";
import { command as commandFile } from "./kind/file/command.ts";
import { command as commandEmpty } from "./kind/empty/command.ts";

export const main: Entrypoint = async (denops) => {
  const tempDir = await Deno.makeTempDir({ prefix: "denops-jqplay.vim" });
  const router = new Router("jqplay");

  const bufferHandler = new BufferHandler();
  const bufferProcessor = bufferHandler.processor();
  router.addHandler("buffer", {
    load: async (ctx, buf) => {
      await bufferHandler.load(denops, ctx, buf);
    },
    save: (_ctx, buf) => {
      bufferProcessor(denops, router, tempDir, buf);
      return Promise.resolve();
    },
  });

  const fileHandler = new FileHandler();
  const fileProcessor = fileHandler.processor();
  router.addHandler("file", {
    load: async (ctx, buf) => {
      await fileHandler.load(denops, ctx, buf);
    },
    save: (_ctx, buf) => {
      fileProcessor(denops, router, tempDir, buf);
      return Promise.resolve();
    },
  });

  const emptyHandler = new EmptyHandler();
  const emptyProcessor = emptyHandler.processor();
  router.addHandler("empty", {
    load: async (ctx, buf) => {
      await emptyHandler.load(denops, ctx, buf);
    },
    save: (_ctx, buf) => {
      emptyProcessor(denops, router, tempDir, buf);
      return Promise.resolve();
    },
  });

  router.addHandler("output", {
    load: async (_ctx, _buf) => {},
  });

  const raw = {
    buffer: async (uParams: unknown) => {
      await startBuffer(denops, router, uParams);
    },
    file: async (uParams: unknown) => {
      await startFile(denops, router, uParams);
    },
    empty: async (uParams: unknown) => {
      await startEmpty(denops, router, uParams);
    },
  };
  // bind params for each entrypoint
  const bound = bindDispatcher(raw, new ParamStore(), "");

  denops.dispatcher = await router.dispatch(denops, {
    ...bound,
    "command:buffer": catchError(
      denops,
      async (uArgs: unknown) => {
        return await commandBuffer(denops, uArgs, bound.buffer);
      },
    ),
    "command:file": catchError(
      denops,
      async (uArgs: unknown) => {
        return await commandFile(denops, uArgs, bound.file);
      },
    ),
    "command:empty": catchError(
      denops,
      async (uArgs: unknown) => {
        return await commandEmpty(denops, uArgs, bound.empty);
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
