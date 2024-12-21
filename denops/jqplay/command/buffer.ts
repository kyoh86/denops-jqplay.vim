import type { Denops } from "jsr:@denops/core@~7.0.0";
import {
  type BufferOpener,
  isBufferOpener,
  type Router,
} from "jsr:@kyoh86/denops-router@~0.3.2";
import { as, is, type Predicate } from "jsr:@core/unknownutil@~4.3.0";

type BufferParams = { source?: number } & BufferOpener;

export const isBufferParams = is.IntersectionOf([
  is.ObjectOf({ source: as.Optional(is.Number) }),
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
