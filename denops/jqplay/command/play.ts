import { NAMESPACE_DNS, v5 as uuid } from "jsr:@std/uuid@~1.0.0";
import type { Denops } from "jsr:@denops/core@~7.0.0";
import type { Router } from "jsr:@kyoh86/denops-router@~0.2.0";
import { is, type Predicate } from "jsr:@core/unknownutil@~4.2.0";

type PlayParams = {
  mods: string;
  file: string;
};

export const isPlayParams = is.ObjectOf({
  mods: is.String,
  file: is.String,
}) satisfies Predicate<PlayParams>;

export async function play(denops: Denops, router: Router, params: PlayParams) {
  const session = await uuid.generate(
    NAMESPACE_DNS,
    new TextEncoder().encode(params.file),
  );
  await router.open(denops, "query", params.mods, {
    kind: "file",
    name: params.file,
    session,
  });
}
