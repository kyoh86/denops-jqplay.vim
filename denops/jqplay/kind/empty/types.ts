import * as v from "jsr:@valibot/valibot@0.42.1";

import type { Schema, StringFields } from "../../types.ts";

export type EmptyParams = Record<never, never>;

export type EmptyFlags = StringFields<EmptyParams>;

export const emptyParamsSchema = v.record(
  v.never(),
  v.never(),
) satisfies Schema<EmptyParams>;

export const emptyFlagSchema = emptyParamsSchema satisfies Schema<EmptyFlags>;

export const emptyFlagsTransform = emptyParamsSchema satisfies Schema<
  EmptyParams
>;

export const emptyParamsTransform = emptyParamsSchema satisfies Schema<
  EmptyParams
>;
