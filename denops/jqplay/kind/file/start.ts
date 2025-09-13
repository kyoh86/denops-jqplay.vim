import type { Denops } from "jsr:@denops/std@8.0.0";
import {
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.5.0";
import * as v from "jsr:@valibot/valibot@1.1.0";

import { paramsToFlags as fileParams } from "./types.ts";
import { paramsToFlags as jqParams } from "../../lib/jq.ts";

export async function start(denops: Denops, router: Router, uParams: unknown) {
  const params = v.parse(
    v.intersect([
      v.pipe(
        v.intersect([jqParams, fileParams]),
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
  await router.open(denops, "file", params.flags, "", params.opener);
}
