import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";

import { flagsSchema } from "../../lib/jq.ts";
import type { Schema } from "../../types.ts";

export async function startBase<Tparams>(
  denops: Denops,
  router: Router,
  uParams: unknown,
  name: string,
  paramsTransform: Schema<Tparams>,
) {
  const params = v.parse(
    v.intersect([
      v.pipe(
        v.intersect([flagsSchema, paramsTransform]),
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
  await router.open(denops, name, params.flags, "", params.opener);
}
