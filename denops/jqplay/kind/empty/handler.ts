import type { Denops } from "jsr:@denops/std@7.5.1";
import type { Buffer } from "jsr:@kyoh86/denops-router@0.5.0";
import * as v from "jsr:@valibot/valibot@1.1.0";
import { TextLineStream } from "jsr:@std/streams@1.0.9";

import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../../lib/stream.ts";
import { type Context, type Flags, flagsSchema } from "../../lib/jq.ts";
import { flagsToParams, type Params } from "./types.ts";
import { BaseHandler } from "../base/handler.ts";

export class EmptyHandler extends BaseHandler<Params> {
  override parseBufParams(
    _denops: Denops,
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
    _params: Params,
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
