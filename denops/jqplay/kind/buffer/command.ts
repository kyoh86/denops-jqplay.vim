import type { Denops } from "jsr:@denops/std@7.5.0";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { parse } from "jsr:@denops/std@7.5.0/argument";
import {
  type BufferOpener,
  bufferOpenerSchema,
} from "jsr:@kyoh86/denops-router@0.4.3";
import * as v from "jsr:@valibot/valibot@0.42.1";
import * as fn from "jsr:@denops/std@7.5.0/function";

import {
  flagsToParams as jqFlags,
  type Params as JqParams,
} from "../../lib/jq.ts";
import {
  flagsToParams as bufFlags,
  type Params as BufParams,
} from "./types.ts";

export async function command(
  denops: Denops,
  uArgs: unknown,
  bound: (uParams: unknown) => Promise<void>,
) {
  const [_, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
  const flags = await v.parseAsync(
    v.intersectAsync([
      jqFlags,
      bufferOpenerSchema,
      v.pipeAsync(
        v.record(v.string(), v.unknown()),
        v.transformAsync(async (x) => {
          if (!("bufnr" in x) && !("bufname" in x)) {
            return { bufnr: `${await fn.bufnr(denops, "%")}` };
          }
          return x;
        }),
        bufFlags,
      ),
    ]),
    uFlags,
  );
  flags satisfies BufParams & JqParams & BufferOpener;
  await bound(flags);
}
