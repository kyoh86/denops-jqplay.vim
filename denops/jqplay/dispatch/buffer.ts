import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import type { Schema } from "../types.ts";
import { type Flags, flagsSchema } from "../lib/jq.ts";

export type BufferParams = { bufnr: number } & Flags & BufferOpener;

export const bufferParamsSchema = v.intersect([
  v.object({ bufnr: v.number() }),
  flagsSchema,
  bufferOpenerSchema,
]) satisfies Schema<BufferParams>;

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
