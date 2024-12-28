import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import type { Schema } from "../types.ts";
import { type Flags, flagsSchema } from "../lib/jq.ts";

export type NullParams = Flags & BufferOpener;

export const nullParamsSchema = v.intersect([
  flagsSchema,
  bufferOpenerSchema,
]) satisfies Schema<NullParams>;

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
