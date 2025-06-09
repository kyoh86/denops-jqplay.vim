import type { Denops } from "jsr:@denops/std@7.5.1";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.5.1/argument";
import {
  type BufferOpener,
  bufferOpenerSchema,
} from "jsr:@kyoh86/denops-router@0.5.0";
import * as v from "jsr:@valibot/valibot@1.1.0";

import { type Flags, flagsSchema } from "../../lib/jq.ts";
import { flagsToParams, type Params } from "./types.ts";

export async function command(
  _denops: Denops,
  uArgs: unknown,
  bound: (uParams: unknown) => Promise<void>,
) {
  const [_, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
  const flags = v.parse(
    v.intersect([flagsSchema, bufferOpenerSchema, flagsToParams]),
    uFlags,
  );
  flags satisfies Params & Flags & BufferOpener;
  await bound(flags);
}
