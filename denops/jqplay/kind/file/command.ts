import type { Denops } from "jsr:@denops/std@7.4.0";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.4.0/argument";
import {
  type BufferOpener,
  bufferOpenerSchema,
} from "jsr:@kyoh86/denops-router@0.3.7";
import { fnamemodify } from "jsr:@denops/std@7.4.0/function";
import * as v from "jsr:@valibot/valibot@0.42.1";

import { type Flags, flagsSchema } from "../../lib/jq.ts";
import type { Params } from "./types.ts";

export async function command(
  denops: Denops,
  uArgs: unknown,
  bound: (uParams: unknown) => Promise<void>,
) {
  const [_, uFlags, srcs] = parse(ensure(uArgs, is.ArrayOf(is.String)));
  const flags = v.parse(
    v.intersect([flagsSchema, bufferOpenerSchema]),
    uFlags,
  );
  flags satisfies Flags & BufferOpener;
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
  await bound(
    { source, ...flags } satisfies (
      & Params
      & Flags
      & BufferOpener
    ),
  );
}
