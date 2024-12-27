import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  type Router,
  validateBufferOpener,
} from "jsr:@kyoh86/denops-router@0.3.6";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { type JqParams, validateJqParams, type Validation } from "../types.ts";

export type BufferParams = { bufnr: number } & JqParams & BufferOpener;

export const validateBufferParams = v.intersect([
  v.object({ bufnr: v.number() }),
  validateJqParams,
  validateBufferOpener,
]) satisfies Validation<BufferParams>;

export async function startFromBuffer(
  denops: Denops,
  router: Router,
  params: BufferParams,
) {
  const { bufnr, split, reuse, ...rest } = params;
  await router.open(
    denops,
    "query",
    { kind: "buffer", source: `${bufnr}`, ...rest },
    "",
    { split, reuse },
  );
}
