import type { Denops } from "jsr:@denops/std@7.4.0";
import type { Buffer } from "jsr:@kyoh86/denops-router@0.3.7";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { TextLineStream } from "jsr:@std/streams@1.0.8";

import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../../lib/stream.ts";
import { type Context, type Flags, flagsSchema } from "../../lib/jq.ts";
import { emptyFlagsTransform, type EmptyParams } from "./types.ts";
import { BaseHandler } from "../base/handler.ts";

export class EmptyHandler extends BaseHandler<EmptyParams> {
  override parseBufParams(
    _denops: Denops,
    buf: Buffer,
  ): Promise<{ flags: Flags; params: EmptyParams }> {
    const params = v.parse(
      v.intersect([
        v.pipe(flagsSchema, v.transform((x) => ({ flags: x }))),
        v.pipe(
          emptyFlagsTransform,
          v.transform((x) => ({ params: x })),
        ),
      ]),
      buf.bufname.params,
    );
    return Promise.resolve(params);
  }

  override getAdditionalContext(): Partial<Context> {
    return {
      nullInput: true,
    };
  }

  override async processCore(
    denops: Denops,
    process: Deno.ChildProcess,
    _params: EmptyParams,
    outputBufnr: number,
  ) {
    // stdoutの結果をoutputBufnrへ書き込み
    await Promise.all([
      process.status,
      process.stdout
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new ChunkLinesTransformStream())
        .pipeTo(new BufferWritingStream(denops, outputBufnr)),
    ]);
  }
}
