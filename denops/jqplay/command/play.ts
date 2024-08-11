import type { Denops } from "jsr:@denops/core@~7.0.0";
import { is, type Predicate } from "jsr:@core/unknownutil@~4.1.0";

type PlayParams = {
  mods: string;
  file: string;
};

export const isPlayParams = is.ObjectOf({
  mods: is.String,
  file: is.String,
}) satisfies Predicate<PlayParams>;

export function play(_denops: Denops, params: PlayParams) {
  console.log(params);
  // jqfilter://session/1/source/empty
  // jqfilter://session/1/source/scratch/<bufnr>
  // jqfilter://session/1/source/file/<source-path>
  //
  // acwrite:
  //     const buf = bufnr("jqoutput://session/1")
  //     if (buf === -1) {
  //      // open new output buffer
  //      // :new
  //     }
  //     const win = await win_findbuf(buf)
  //     if (win === []) {
  //      // open new window
  //      // :sbuf buf
  //     }
}
