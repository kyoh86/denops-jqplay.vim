import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import * as fn from "jsr:@denops/std@7.4.0/function";

import { bufferParamsTransform } from "./types.ts";
import { flagsSchema } from "../../lib/jq.ts";

export async function start(denops: Denops, router: Router, uParams: unknown) {
  const params = await v.parseAsync(
    v.intersectAsync([
      v.pipeAsync(
        v.intersectAsync([
          flagsSchema,
          v.pipeAsync(
            bufferParamsTransform,
            v.transformAsync(async (x) => {
              if (!("bufnr" in x) && !("bufname" in x)) {
                return { bufnr: `${await fn.bufnr(denops, "%")}` };
              }
              return x;
            }),
          ),
        ]),
        v.transformAsync((x) =>
          Promise.resolve({
            flags: x,
          })
        ),
      ),
      v.pipeAsync(
        bufferOpenerSchema,
        v.transformAsync((x) =>
          Promise.resolve({
            opener: x,
          })
        ),
      ),
    ]),
    uParams,
  );
  await router.open(denops, "buffer", params.flags, "", params.opener);
}
