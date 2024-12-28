import * as v from "jsr:@valibot/valibot@0.42.1";
import type { Denops } from "jsr:@denops/std@7.4.0";
import * as fn from "jsr:@denops/std@7.4.0/function";

import { empty, numeric, type Schema } from "../types.ts";

const keyValueFlagSchema = v.array(
  v.pipe(
    v.string(),
    v.regex(/^\w[\w-]*=.*$/),
  ),
);

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
  "jq-raw-input": v.pipe(v.string(), empty), // Read each line as string instead of JSON
  "jq-slurp": v.pipe(v.string(), empty), // Read all inputs into an array and use it as the single input value
  "jq-compact-output": v.pipe(v.string(), empty), // Compact instead of pretty-printed output
  "jq-raw-output": v.pipe(v.string(), empty), // Output strings without escapes and quotes
  "jq-join-output": v.pipe(v.string(), empty), // Implies -r and output without newline after each output
  "jq-ascii-output": v.pipe(v.string(), empty), // Output strings by only ASCII characters using escape sequences
  "jq-sort-keys": v.pipe(v.string(), empty), // Sort keys of each object on output
  "jq-tab": v.pipe(v.string(), empty), // Use tabs for indentation
  "jq-indent": v.pipe(v.string(), numeric), // Use n spaces for indentation (max 7 spaces)
  "jq-stream": v.pipe(v.string(), empty), // Parse the input value in streaming fashion
  "jq-stream-errors": v.pipe(v.string(), empty), // Implies --stream and report parse error as an array
  "jq-seq": v.pipe(v.string(), empty), // Parse input/output as application/json-seq
  "jq-arg": keyValueFlagSchema, // Set $name to the string value
  "jq-argjson": keyValueFlagSchema, // Set $name to the JSON value
  "jq-slurpfile": keyValueFlagSchema, // Set$name to an array of JSON values read from the file
  "jq-rawfile": keyValueFlagSchema, // Set $name to string contents of file
  "jq-cwd": v.string(),
  "jq-bin": v.string(),
})) satisfies Schema<Flags>;

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
