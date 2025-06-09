import * as v from "jsr:@valibot/valibot@1.1.0";
import type { Denops } from "jsr:@denops/std@7.5.1";
import * as fn from "jsr:@denops/std@7.5.1/function";

import {
  empty,
  numberToString,
  numeric,
  type Schema,
  stringToNumber,
} from "../types.ts";

const keyValueFlagSchema = v.array(
  v.pipe(
    v.string(),
    v.regex(/^\w[\w-]*=.*$/),
  ),
);

export type Params = Partial<{
  "jq-raw-input": true;
  "jq-slurp": true;
  "jq-compact-output": true;
  "jq-raw-output": true;
  "jq-join-output": true;
  "jq-ascii-output": true;
  "jq-sort-keys": true;
  "jq-tab": true;
  "jq-indent": number;
  "jq-stream": true;
  "jq-stream-errors": true;
  "jq-seq": true;
  "jq-arg": Record<string, string>;
  "jq-argjson": Record<string, string>;
  "jq-slurpfile": Record<string, string>;
  "jq-rawfile": Record<string, string>;
  "jq-cwd": string;
  "jq-bin": string;
}>;

export const paramsSchema = v.partial(v.object({
  "jq-raw-input": v.literal(true),
  "jq-slurp": v.literal(true),
  "jq-compact-output": v.literal(true),
  "jq-raw-output": v.literal(true),
  "jq-join-output": v.literal(true),
  "jq-ascii-output": v.literal(true),
  "jq-sort-keys": v.literal(true),
  "jq-tab": v.literal(true),
  "jq-indent": v.number(),
  "jq-stream": v.literal(true),
  "jq-stream-errors": v.literal(true),
  "jq-seq": v.literal(true),
  "jq-arg": v.record(v.string(), v.string()),
  "jq-argjson": v.record(v.string(), v.string()),
  "jq-slurpfile": v.record(v.string(), v.string()),
  "jq-rawfile": v.record(v.string(), v.string()),
  "jq-cwd": v.string(),
  "jq-bin": v.string(),
})) satisfies Schema<Params>;

export type Flags = Partial<{
  "jq-raw-input": string;
  "jq-slurp": string;
  "jq-compact-output": string;
  "jq-raw-output": string;
  "jq-join-output": string;
  "jq-ascii-output": string;
  "jq-sort-keys": string;
  "jq-tab": string;
  "jq-indent": string;
  "jq-stream": string;
  "jq-stream-errors": string;
  "jq-seq": string;
  "jq-arg": string[];
  "jq-argjson": string[];
  "jq-slurpfile": string[];
  "jq-rawfile": string[];
  "jq-cwd": string;
  "jq-bin": string;
}>;

export const flagsSchema = v.partial(v.object({
  "jq-raw-input": v.pipe(v.string(), empty),
  "jq-slurp": v.pipe(v.string(), empty),
  "jq-compact-output": v.pipe(v.string(), empty),
  "jq-raw-output": v.pipe(v.string(), empty),
  "jq-join-output": v.pipe(v.string(), empty),
  "jq-ascii-output": v.pipe(v.string(), empty),
  "jq-sort-keys": v.pipe(v.string(), empty),
  "jq-tab": v.pipe(v.string(), empty),
  "jq-indent": v.pipe(v.string(), numeric),
  "jq-stream": v.pipe(v.string(), empty),
  "jq-stream-errors": v.pipe(v.string(), empty),
  "jq-seq": v.pipe(v.string(), empty),
  "jq-arg": keyValueFlagSchema,
  "jq-argjson": keyValueFlagSchema,
  "jq-slurpfile": keyValueFlagSchema,
  "jq-rawfile": keyValueFlagSchema,
  "jq-cwd": v.string(),
  "jq-bin": v.string(),
})) satisfies Schema<Flags>;

const stringToTrue = v.pipe(
  v.optional(v.string()),
  v.transform((x) => x === undefined ? undefined : true),
);

const trueToString = v.pipe(
  v.optional(v.literal(true)),
  v.transform((x) => x ? "" : undefined),
);

const keyValueFlagToRecord = v.pipe(
  keyValueFlagSchema,
  v.transform((x) => {
    const record: Record<string, string> = {};
    for (const item of x) {
      const [key, value] = item.split("=", 2);
      record[key] = value;
    }
    return record;
  }),
);

export const flagsToParams = v.object({
  "jq-raw-input": stringToTrue,
  "jq-slurp": stringToTrue,
  "jq-compact-output": stringToTrue,
  "jq-raw-output": stringToTrue,
  "jq-join-output": stringToTrue,
  "jq-ascii-output": stringToTrue,
  "jq-sort-keys": stringToTrue,
  "jq-tab": stringToTrue,
  "jq-indent": v.optional(stringToNumber),
  "jq-stream": stringToTrue,
  "jq-stream-errors": stringToTrue,
  "jq-seq": stringToTrue,
  "jq-arg": v.optional(keyValueFlagToRecord),
  "jq-argjson": v.optional(keyValueFlagToRecord),
  "jq-slurpfile": v.optional(keyValueFlagToRecord),
  "jq-rawfile": v.optional(keyValueFlagToRecord),
  "jq-cwd": v.optional(v.string()),
  "jq-bin": v.optional(v.string()),
}) satisfies Schema<Params>;

const recordToKeyValueFlag = v.pipe(
  v.record(v.string(), v.string()),
  v.transform((x) => {
    const list: string[] = [];
    for (const [key, value] of Object.entries(x)) {
      list.push(`${key}=${value}`);
    }
    return list;
  }),
);

export const paramsToFlags = v.object({
  "jq-raw-input": trueToString,
  "jq-slurp": trueToString,
  "jq-compact-output": trueToString,
  "jq-raw-output": trueToString,
  "jq-join-output": trueToString,
  "jq-ascii-output": trueToString,
  "jq-sort-keys": trueToString,
  "jq-tab": trueToString,
  "jq-indent": v.optional(numberToString),
  "jq-stream": trueToString,
  "jq-stream-errors": trueToString,
  "jq-seq": trueToString,
  "jq-arg": v.optional(recordToKeyValueFlag),
  "jq-argjson": v.optional(recordToKeyValueFlag),
  "jq-slurpfile": v.optional(recordToKeyValueFlag),
  "jq-rawfile": v.optional(recordToKeyValueFlag),
  "jq-cwd": v.optional(v.string()),
  "jq-bin": v.optional(v.string()),
}) satisfies Schema<Flags>;

function expandFlags(flags: Flags): string[] {
  return Object.entries(flags).flatMap(([field, value]) => {
    if (field == "jq-cwd" || field == "jq-bin") {
      return [];
    }
    if (value === undefined) {
      return [];
    }
    const name = field.replace(/^jq-/, "");
    if (
      field === "jq-arg" || field === "jq-argjson" ||
      field === "jq-slurpfile" || field === "jq-rawfile"
    ) {
      return [
        `--${name}`,
        ...(value as string[]).flatMap((v) => v.split("=", 2)),
      ];
    }
    if (value === "") {
      return [`--${name}`];
    }
    return [`--${name}`, ...(typeof value === "string" ? [value] : value)];
  });
}

export type Context = {
  denops: Denops;
  signal: AbortSignal;
  fromFile: string;
  nullInput?: true;
};

export async function start(
  ctx: Context,
  flags: Flags,
) {
  const cmd = new Deno.Command(
    flags["jq-bin"] ?? "jq",
    {
      args: [
        "--monochrome-output",
        "--unbuffered",
        "--exit-status",
        ...["--from-file", ctx.fromFile],
        ...ctx.nullInput ? ["--null-input"] : [],
        ...expandFlags(flags),
      ],
      cwd: flags["jq-cwd"] ?? await fn.getcwd(ctx.denops),
      signal: ctx.signal,
      stdin: "piped",
      stdout: "piped",
    },
  );
  const process = cmd.spawn();
  return process;
}
