import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  isBufferOpener,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.5";
import { as, is, type Predicate } from "jsr:@core/unknownutil@4.3.0";

export type BufferParams = {
  source?: number;
  rawInput: boolean;
  slurp: boolean;
  compactOutput: boolean;
  rawOutput: boolean;
  joinOutput: boolean;
  asciiOutput: boolean;
  sortKeys: boolean;
  tab: boolean;
  indent: string;
  stream: boolean;
  streamErrors: boolean;
  seq: boolean;
} & BufferOpener;

export const isBufferParams = is.IntersectionOf([
  is.ObjectOf({
    source: as.Optional(is.Number),
    rawInput: is.Boolean, // Read each line as string instead of JSON
    slurp: is.Boolean, // Read all inputs into an array and use it as the single input value
    compactOutput: is.Boolean, // Compact instead of pretty-printed output
    rawOutput: is.Boolean, // Output strings without escapes and quotes
    joinOutput: is.Boolean, // Implies -r and output without newline after each output
    asciiOutput: is.Boolean, // Output strings by only ASCII characters using escape sequences
    sortKeys: is.Boolean, // Sort keys of each object on output
    tab: is.Boolean, // Use tabs for indentation
    indent: is.String, // Use n spaces for indentation (max 7 spaces)
    stream: is.Boolean, // Parse the input value in streaming fashion
    streamErrors: is.Boolean, // Implies --stream and report parse error as an array
    seq: is.Boolean, // Parse input/output as application/json-seq
  }),
  isBufferOpener,
]) satisfies Predicate<BufferParams>;

export async function buffer(
  denops: Denops,
  router: Router,
  params: BufferParams,
) {
  const { source, ...rest } = params;
  await router.open(
    denops,
    "query",
    { kind: "buffer", source: `${source}` },
    "",
    rest,
  );
}
