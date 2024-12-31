import type { Denops } from "jsr:@denops/std@7.4.0";
import {
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.4.2";
import * as v from "jsr:@valibot/valibot@0.42.1";

import { flagsSchema } from "../../lib/jq.ts";
import { paramsToFlags } from "./types.ts";

export async function start(denops: Denops, router: Router, uParams: unknown) {
  const params = v.parse(
    v.intersect([
      v.pipe(
        v.intersect([flagsSchema, paramsToFlags]),
        v.transform((x) => ({
          flags: x,
        })),
      ),
      v.pipe(
        bufferOpenerSchema,
        v.transform((x) => ({
          opener: x,
        })),
      ),
    ]),
    uParams,
  );
  await router.open(denops, "empty", params.flags, "", params.opener);
}
