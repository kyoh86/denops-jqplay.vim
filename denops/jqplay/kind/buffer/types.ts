import * as v from "jsr:@valibot/valibot@0.42.1";

import {
  numberToString,
  numericString,
  type Schema,
  type StringFields,
  stringToNumber,
} from "../../types.ts";

export type BufferParams =
  | Record<string, never>
  | { bufnr: number }
  | { bufname: string }
  | { lnum: number | "$"; end: number | "$" }
  | { bufnr: number; lnum: number | "$"; end: number | "$" }
  | { bufname: string; lnum: number | "$"; end: number | "$" };

export type BufferRangeParams = {
  lnum: number | "$";
  end: number | "$";
};

export type BufferRangeFlags = {
  lnum: string | "$";
  end: string | "$";
};

export type BufferFlags = StringFields<BufferParams>;

const bufferRangeParamsSchemaFields = {
  lnum: v.union([v.number(), v.literal("$")]),
  end: v.union([v.number(), v.literal("$")]),
};

export const bufferParamsSchema = v.union([
  v.record(v.string(), v.never()),
  v.object({ bufnr: v.number() }),
  v.object({ bufname: v.string() }),
  v.object({ ...bufferRangeParamsSchemaFields }),
  v.object({ bufnr: v.number(), ...bufferRangeParamsSchemaFields }),
  v.object({ bufname: v.string(), ...bufferRangeParamsSchemaFields }),
]) satisfies Schema<BufferParams>;

const bufferRangeFlagsSchemaFields = {
  lnum: v.union([numericString, v.literal("$")]),
  end: v.union([numericString, v.literal("$")]),
};

export const bufferFlagSchema = v.union([
  v.record(v.string(), v.never()),
  v.object({ bufnr: v.string() }),
  v.object({ bufname: v.string() }),
  v.object({ ...bufferRangeFlagsSchemaFields }),
  v.object({ bufnr: v.string(), ...bufferRangeFlagsSchemaFields }),
  v.object({ bufname: v.string(), ...bufferRangeFlagsSchemaFields }),
]) satisfies Schema<BufferFlags>;

const bufferRangeFlagsTransformFields = {
  lnum: v.union([stringToNumber, v.literal("$")]),
  end: v.union([stringToNumber, v.literal("$")]),
};

export const bufferFlagsTransform = v.union([
  v.record(v.string(), v.never()),
  v.object({ bufnr: stringToNumber }),
  v.object({ bufname: v.string() }),
  v.object({ ...bufferRangeFlagsTransformFields }),
  v.object({ bufnr: stringToNumber, ...bufferRangeFlagsTransformFields }),
  v.object({ bufname: v.string(), ...bufferRangeFlagsTransformFields }),
]) satisfies Schema<BufferParams>;

const bufferRangeParamsTransformFields = {
  lnum: v.union([numberToString, v.literal("$")]),
  end: v.union([numberToString, v.literal("$")]),
};

export const bufferParamsTransform = v.union([
  v.record(v.string(), v.never()),
  v.object({ bufnr: numberToString }),
  v.object({ bufname: v.string() }),
  v.object({ ...bufferRangeParamsTransformFields }),
  v.object({ bufnr: numberToString, ...bufferRangeParamsTransformFields }),
  v.object({ bufname: v.string(), ...bufferRangeParamsTransformFields }),
]) satisfies Schema<BufferFlags>;
