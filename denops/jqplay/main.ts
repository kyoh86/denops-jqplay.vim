import type { Entrypoint } from "jsr:@denops/core@~7.0.0";
import {
  bindDispatcher,
  ParamStore,
} from "jsr:@kyoh86/denops-bind-params@^0.0.4-alpha.1";
import { ensure, is, type Predicate } from "jsr:@core/unknownutil@~4.3.0";
import { parse } from "jsr:@denops/std@~7.4.0/argument";
import {
  type Buffer,
  Router,
  type Split as RouterSplit,
} from "jsr:@kyoh86/denops-router@~0.3.2";
import { fnamemodify } from "jsr:@denops/std@~7.4.0/function";
import * as fn from "jsr:@denops/std@~7.4.0/function";

import { file, isFileParams } from "./command/file.ts";
import { loadQueryBuffer, processQuery } from "./handler/query.ts";
import { buffer, isBufferParams } from "./command/buffer.ts";

type Split =
  | ""
  | "none"
  | "top"
  | "above"
  | "below"
  | "bottom"
  | "leftmost"
  | "left"
  | "right"
  | "rightmost"
  | "tab";

const isSplit = is.UnionOf([
  is.LiteralOf(""),
  is.LiteralOf("none"),
  is.LiteralOf("top"),
  is.LiteralOf("above"),
  is.LiteralOf("below"),
  is.LiteralOf("bottom"),
  is.LiteralOf("leftmost"),
  is.LiteralOf("left"),
  is.LiteralOf("right"),
  is.LiteralOf("rightmost"),
  is.LiteralOf("tab"),
]) satisfies Predicate<Split>;

function splitToRouter(s?: Split): RouterSplit | undefined {
  if (s === undefined) {
    return undefined;
  }
  switch (s) {
    case "":
      return "";
    case "none":
      return "none";
    case "top":
      return "split-top";
    case "above":
      return "split-above";
    case "bottom":
      return "split-below";
    case "leftmost":
      return "split-leftmost";
    case "left":
      return "split-left";
    case "rightmost":
      return "split-rightmost";
    case "right":
      return "split-right";
    case "tab":
      return "split-tab";
  }
}

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
      await file(denops, router, ensure(uParams, isFileParams));
    },
    buffer: async (uParams: unknown) => {
      await buffer(denops, router, ensure(uParams, isBufferParams));
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
          const flags = ensure(
            uFlags,
            is.PartialOf(is.ObjectOf({
              source: is.String,
              split: isSplit,
            })),
          );

          const bufnr = flags.source
            ? Number(flags.source)
            : await fn.bufnr(denops);
          await bound.buffer({
            source: bufnr,
            split: splitToRouter(flags.split),
          });
          break;
        }
        case 1: {
          const flags = ensure(
            uFlags,
            is.PartialOf(is.ObjectOf({ split: isSplit })),
          );
          await bound.file({
            source: await fnamemodify(denops, sources[0], "p"),
            split: splitToRouter(flags.split),
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
