import type { Denops } from "jsr:@denops/core@7.0.1";
import {
  type BufferOpener,
  isBufferOpener,
  type Router,
} from "jsr:@kyoh86/denops-router@0.3.3";
import { is, type Predicate } from "jsr:@core/unknownutil@4.3.0";

type FileParams = { source: string } & BufferOpener;

export const isFileParams = is.IntersectionOf([
  is.ObjectOf({ source: is.String }),
  isBufferOpener,
]) satisfies Predicate<FileParams>;

export async function file(
  denops: Denops,
  router: Router,
  params: FileParams,
) {
  const { source, ...rest } = params;
  await router.open(denops, "query", { kind: "file", source }, "", rest);
}
