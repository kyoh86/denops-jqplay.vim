import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import type { Schema } from "../types.ts";
import { type Flags, flagsSchema } from "../lib/jq.ts";

export type BufferParams =
  & { bufnr: number }
  & (Record<never, never> | {
    range: number;
    line1: number;
    line2: number;
  })
  & Flags
  & BufferOpener;

export const bufferParamsSchema = v.intersect([
  v.union([
    v.object({ bufnr: v.number() }),
    v.object({
      bufnr: v.number(),
      range: v.number(),
      line1: v.number(),
      line2: v.number(),
    }),
  ]),
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
