// Type definitions for denops-jqplay.vim
// export type Foo = "foo" | "bar" | "baz";

import type { BaseIssue, BaseSchema } from "jsr:@valibot/valibot@0.42.1";
import * as v from "jsr:@valibot/valibot@0.42.1";

export type Schema<TSchema> = BaseSchema<
  unknown,
  TSchema,
  BaseIssue<unknown>
>;

export const numeric = v.regex(/^\d+$/);
export const empty = v.regex(/^$/);
