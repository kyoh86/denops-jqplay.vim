import type { Denops } from "jsr:@denops/core@7.0.1";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.4.0/argument";
import {
  type BufferOpener,
  bufferOpenerSchema,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";

import { type Flags, flagsSchema } from "../../lib/jq.ts";
import { bufferFlagsTransform, type BufferParams } from "./types.ts";

export async function command(
  _denops: Denops,
  uArgs: unknown,
  bound: (uParams: unknown) => Promise<void>,
) {
  const [_, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
  const flags = v.parse(
    v.intersect([flagsSchema, bufferOpenerSchema, bufferFlagsTransform]),
    uFlags,
  );
  flags satisfies BufferParams & Flags & BufferOpener;
  await bound(flags);
}
