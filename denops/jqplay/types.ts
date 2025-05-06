// Type definitions for denops-jqplay.vim
// export type Foo = "foo" | "bar" | "baz";

import type { BaseIssue, BaseSchema } from "jsr:@valibot/valibot@1.1.0";
import * as v from "jsr:@valibot/valibot@1.1.0";

export type Schema<TSchema> = BaseSchema<
  unknown,
  TSchema,
  BaseIssue<unknown>
>;

export const numeric = v.regex(/^\d+$/);
export const empty = v.regex(/^$/);

export const numericString = v.pipe(v.string(), numeric);
export const stringToNumber = v.pipe(
  v.string(),
  numeric,
  v.transform((x) => Number(x)),
) satisfies Schema<number>;

export const numberToString = v.pipe(
  v.number(),
  v.transform((x) => `${x}`),
) satisfies Schema<string>;

export type StringFields<T> = {
  [K in keyof T]: string;
};

export enum Filetype {
  Query = "jqplay-query.jq",
}
