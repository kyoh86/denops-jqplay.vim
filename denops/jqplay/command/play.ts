import type { Denops } from "jsr:@denops/core@~7.0.0";
import {
  type BufferOpener,
  isBufferOpener,
  type Router,
} from "jsr:@kyoh86/denops-router@~0.3.0";
import { is, type Predicate } from "jsr:@core/unknownutil@~4.3.0";

type PlayParams = { file: string } & BufferOpener;

export const isPlayParams = is.IntersectionOf([
  is.ObjectOf({ file: is.String }),
  isBufferOpener,
]) satisfies Predicate<PlayParams>;

export async function play(denops: Denops, router: Router, params: PlayParams) {
  const { file, ...rest } = params;
  await router.open(denops, "query", { kind: "file", name: file }, "", rest);
}
