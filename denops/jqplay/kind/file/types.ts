import * as v from "jsr:@valibot/valibot@1.1.0";

import type { Schema, StringFields } from "../../types.ts";

export type Params = { source: string };
export const paramsSchema = v.object({
  source: v.string(),
}) satisfies Schema<Params>;

export type Flags = StringFields<Params>;
export const flagSchema = paramsSchema satisfies Schema<Flags>;

export const flagsToParams = paramsSchema satisfies Schema<Params>;
export const paramsToFlags = paramsSchema satisfies Schema<Flags>;
