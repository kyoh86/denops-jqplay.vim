import type { Denops } from "jsr:@denops/std@7.5.0";
import type { Buffer } from "jsr:@kyoh86/denops-router@0.5.0";
import * as fn from "jsr:@denops/std@7.5.0/function";
import * as v from "jsr:@valibot/valibot@1.1.0";
import { TextLineStream } from "jsr:@std/streams@1.0.9";

import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../../lib/stream.ts";
import { type Flags, flagsSchema } from "../../lib/jq.ts";
import { flagsToParams, type Params } from "./types.ts";
import { BaseHandler } from "../base/handler.ts";

export class FileHandler extends BaseHandler<Params> {
  override async parseBufParams(
    denops: Denops,
    buf: Buffer,
  ): Promise<{ flags: Flags; params: Params }> {
    const params = v.parse(
      v.intersect([
        v.pipe(flagsSchema, v.transform((x) => ({ flags: x }))),
        v.pipe(
          flagsToParams,
          v.transform((x) => ({ params: x })),
        ),
      ]),
      buf.bufname.params,
    );
    if (await fn.filereadable(denops, params.params.source) !== 1) {
      throw new Error(`file ${params.params.source} is not readable`);
    }
    return params;
  }

  override async processCore(
    denops: Denops,
    process: Deno.ChildProcess,
    params: Params,
    outputBufnr: number,
  ) {
    const file = await Deno.open(params.source, { read: true });
    try {
      await Promise.all([
        process.status,
        file.readable.pipeTo(process.stdin),
        process.stdout
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new TextLineStream())
          .pipeThrough(new ChunkLinesTransformStream())
          .pipeTo(new BufferWritingStream(denops, outputBufnr)),
      ]);
    } finally {
      file.close();
    }
  }
}
