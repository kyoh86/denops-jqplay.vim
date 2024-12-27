import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  type Router,
  validateBufferOpener,
} from "jsr:@kyoh86/denops-router@0.3.6";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { type JqParams, validateJqParams, type Validation } from "../types.ts";

export type NullParams = JqParams & BufferOpener;

export const validateNullParams = v.intersect([
  validateJqParams,
  validateBufferOpener,
]) satisfies Validation<NullParams>;

export async function startFromNull(
  denops: Denops,
  router: Router,
  params: NullParams,
) {
  const { split, reuse, ...rest } = params;
  await router.open(
    denops,
    "query",
    { kind: "null", ...rest },
    "",
    { split, reuse },
  );
}
