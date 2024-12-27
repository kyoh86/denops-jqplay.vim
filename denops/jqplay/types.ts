// Type definitions for denops-jqplay.vim
// export type Foo = "foo" | "bar" | "baz";

import type { BaseIssue, BaseSchema } from "jsr:@valibot/valibot@0.42.1";
import * as v from "jsr:@valibot/valibot@0.42.1";

export type Validation<TSchema> = BaseSchema<
  unknown,
  TSchema,
  BaseIssue<unknown>
>;

export type JqParams = Partial<{
  "raw-input": string;
  slurp: string;
  "compact-output": string;
  "raw-output": string;
  "join-output": string;
  "ascii-output": string;
  "sort-keys": string;
  tab: string;
  indent: string;
  stream: string;
  "stream-errors": string;
  seq: string;
}>;

export const validateJqParams = v.partial(v.object({
  "raw-input": v.pipe(v.string(), v.regex(/^$/)), // Read each line as string instead of JSON
  slurp: v.pipe(v.string(), v.regex(/^$/)), // Read all inputs into an array and use it as the single input value
  "compact-output": v.pipe(v.string(), v.regex(/^$/)), // Compact instead of pretty-printed output
  "raw-output": v.pipe(v.string(), v.regex(/^$/)), // Output strings without escapes and quotes
  "join-output": v.pipe(v.string(), v.regex(/^$/)), // Implies -r and output without newline after each output
  "ascii-output": v.pipe(v.string(), v.regex(/^$/)), // Output strings by only ASCII characters using escape sequences
  "sort-keys": v.pipe(v.string(), v.regex(/^$/)), // Sort keys of each object on output
  tab: v.pipe(v.string(), v.regex(/^$/)), // Use tabs for indentation
  indent: v.pipe(v.pipe(v.string(), v.regex(/^$/)), v.regex(/^\d\+$/)), // Use n spaces for indentation (max 7 spaces)
  stream: v.pipe(v.string(), v.regex(/^$/)), // Parse the input value in streaming fashion
  "stream-errors": v.pipe(v.string(), v.regex(/^$/)), // Implies --stream and report parse error as an array
  seq: v.pipe(v.string(), v.regex(/^$/)), // Parse input/output as application/json-seq
})) satisfies Validation<JqParams>;
