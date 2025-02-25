import type { Denops } from "jsr:@denops/std@7.5.0";
import type { Buffer } from "jsr:@kyoh86/denops-router@0.4.3";
import * as fn from "jsr:@denops/std@7.5.0/function";
import * as v from "jsr:@valibot/valibot@0.42.1";
import { TextLineStream } from "jsr:@std/streams@1.0.9";

import {
  BufferWritingStream,
  ChunkLinesTransformStream,
} from "../../lib/stream.ts";
import { type Flags, flagsSchema } from "../../lib/jq.ts";
import { flagsToParams, type Params, type RangeParams } from "./types.ts";
import { BaseHandler } from "../base/handler.ts";

export class BufferHandler extends BaseHandler<Params> {
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
    if ("bufnr" in params.params) {
      if (!await fn.bufloaded(denops, params.params.bufnr)) {
        throw new Error(`buffer ${params.params.bufnr} is not loaded`);
      }
    }
    if ("bufname" in params.params) {
      if (!await fn.bufloaded(denops, params.params.bufname)) {
        throw new Error(`buffer ${params.params.bufname} is not loaded`);
      }
    }
    return params;
  }

  #getRange(p: Params): RangeParams {
    if (!("lnum" in p)) {
      return { lnum: 1, end: "$" };
    }
    return { lnum: p.lnum, end: p.end };
  }

  override async processCore(
    denops: Denops,
    process: Deno.ChildProcess,
    params: Params,
    outputBufnr: number,
  ) {
    const { lnum, end } = this.#getRange(params);
    const lines = await fn.getbufline(
      denops,
      "bufnr" in params ? params.bufnr : params.bufname,
      lnum,
      end,
    );

    // バッファ内容を改行で結合
    const inputText = lines.join("\n") + "\n";
    const encoder = new TextEncoder();
    const inputData = encoder.encode(inputText);

    // stdinへ一括書き込み
    const writer = process.stdin.getWriter();
    await writer.write(inputData);
    await writer.close();

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
