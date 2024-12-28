import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  bufferOpenerSchema,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import type { Schema } from "../types.ts";
import { type Flags, flagsSchema } from "../lib/jq.ts";

export type FileParams = { source: string } & Flags & BufferOpener;

export const fileParamsSchema = v.intersect([
  v.object({ source: v.string() }),
  flagsSchema,
  bufferOpenerSchema,
]) satisfies Schema<FileParams>;

export async function startFromFile(
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
