import * as v from "jsr:@valibot/valibot@0.42.1";

import {
  numberToString,
  numericString,
  type Schema,
  stringToNumber,
} from "../../types.ts";

export type Params =
  | { bufnr: number }
  | { bufname: string }
  | { bufnr: number; lnum: number | "$"; end: number | "$" }
  | { bufname: string; lnum: number | "$"; end: number | "$" };

export type RangeParams = {
  lnum: number | "$";
  end: number | "$";
};

export type RangeFlags = {
  lnum: string | "$";
  end: string | "$";
};

export type Flags =
  | { bufnr: string }
  | { bufname: string }
  | { bufnr: string; lnum: string | "$"; end: string | "$" }
  | { bufname: string; lnum: string | "$"; end: string | "$" };

const rangeParamsSchemaFields = {
  lnum: v.union([v.number(), v.literal("$")]),
  end: v.union([v.number(), v.literal("$")]),
};

export const paramsSchema = v.union([
  v.object({ bufnr: v.number() }),
  v.object({ bufname: v.string() }),
  v.object({ bufnr: v.number(), ...rangeParamsSchemaFields }),
  v.object({ bufname: v.string(), ...rangeParamsSchemaFields }),
]) satisfies Schema<Params>;

const rangeFlagsSchemaFields = {
  lnum: v.union([numericString, v.literal("$")]),
  end: v.union([numericString, v.literal("$")]),
};

export const flagSchema = v.union([
  v.object({ bufnr: v.string() }),
  v.object({ bufname: v.string() }),
  v.object({ bufnr: v.string(), ...rangeFlagsSchemaFields }),
  v.object({ bufname: v.string(), ...rangeFlagsSchemaFields }),
]) satisfies Schema<Flags>;

const rangeFlagsToParamsFields = {
  lnum: v.union([stringToNumber, v.literal("$")]),
  end: v.union([stringToNumber, v.literal("$")]),
};

export const flagsToParams = v.union([
  v.object({ bufnr: stringToNumber }),
  v.object({ bufname: v.string() }),
  v.object({ bufnr: stringToNumber, ...rangeFlagsToParamsFields }),
  v.object({ bufname: v.string(), ...rangeFlagsToParamsFields }),
]) satisfies Schema<Params>;

const rangeParamsToFlagsFields = {
  lnum: v.union([numberToString, v.literal("$")]),
  end: v.union([numberToString, v.literal("$")]),
};

export const paramsToFlags = v.union([
  v.object({ bufnr: numberToString }),
  v.object({ bufname: v.string() }),
  v.object({ bufnr: numberToString, ...rangeParamsToFlagsFields }),
  v.object({ bufname: v.string(), ...rangeParamsToFlagsFields }),
]) satisfies Schema<Flags>;
