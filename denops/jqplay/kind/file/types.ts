import * as v from "jsr:@valibot/valibot@0.42.1";

import type { Schema, StringFields } from "../../types.ts";

export type FileParams = { source: string };

export type FileFlags = StringFields<FileParams>;

export const fileParamsSchema = v.object({
  source: v.string(),
}) satisfies Schema<FileParams>;

export const fileFlagSchema = fileParamsSchema satisfies Schema<FileFlags>;

export const fileFlagsTransform = fileParamsSchema satisfies Schema<FileParams>;
export const fileParamsTransform = fileParamsSchema satisfies Schema<
  FileParams
>;

