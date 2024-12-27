import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  type Router,
  validateBufferOpener,
} from "jsr:@kyoh86/denops-router@0.3.6";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { type JqParams, validateJqParams, type Validation } from "../types.ts";

export type FileParams = { source: string } & JqParams & BufferOpener;

export const validateFileParams = v.intersect([
  v.object({ source: v.string() }),
  validateJqParams,
  validateBufferOpener,
]) satisfies Validation<FileParams>;

export async function file(
  denops: Denops,
  router: Router,
  params: FileParams,
) {
  const { source, split, reuse, ...rest } = params;
  await router.open(
    denops,
    "query",
    { kind: "file", source, ...rest },
    "",
    { split, reuse },
  );
}
