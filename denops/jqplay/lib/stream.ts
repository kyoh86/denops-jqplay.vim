import type { Denops } from "jsr:@denops/std@~7.4.0";
import * as buffer from "jsr:@denops/std@~7.4.0/buffer";

export class BufferWritingStream extends WritableStream<string[]> {
  constructor(denops: Denops, bufnr: number) {
    let lnum = 0;
    super({
      start: async () => {
        await buffer.replace(denops, bufnr, ["Processing..."], {});
        lnum = 0;
      },
      write: async (chunk, _controller) => {
        if (lnum == 0) {
          await buffer.replace(denops, bufnr, chunk, {});
        } else {
          await buffer.append(denops, bufnr, chunk, { lnum });
        }
        lnum += chunk.length;
      },
    });
  }
}

export class ChunkLinesTransformStream
  extends TransformStream<string, string[]> {
  constructor(chunkSize = 50) {
    let lines: string[] = [];
    super({
      start: () => {
        lines = [];
      },
      transform(chunk, controller) {
        lines.push(chunk);
        if (lines.length > chunkSize) {
          controller.enqueue(lines);
          lines = [];
        }
      },
      flush(controller) {
        if (lines.length > 0) {
          controller.enqueue(lines);
        }
      },
    });
  }
}
