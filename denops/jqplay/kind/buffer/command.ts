import type { Denops } from "jsr:@denops/std@7.4.0";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.4.0/argument";
import {
  type BufferOpener,
  bufferOpenerSchema,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";

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
