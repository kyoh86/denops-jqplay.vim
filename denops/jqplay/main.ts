import type { Denops } from "jsr:@denops/core@~7.0.0";
import { bindDispatcher } from "jsr:@kyoh86/denops-bind-params@~0.0.2";
import { kebabToCamel } from "jsr:@kyoh86/denops-bind-params@~0.0.2/keycase";
import { ensure, is } from "jsr:@core/unknownutil@~4.0.0";
import { parse } from "https://deno.land/x/denops_std@v6.5.1/argument/mod.ts";
import { isPlayParams, play } from "./command/play.ts";

export function main(denops: Denops) {
  const bound = bindDispatcher({
    play: (uParams: unknown) => {
      return play(denops, ensure(uParams, isPlayParams));
    },
  });

  denops.dispatcher = {
    ...bound,
    "command:play": async (uMods: unknown, uArgs: unknown) => {
      const [_uOpts, uFlags] = parse(ensure(uArgs, is.ArrayOf(is.String)));
      const mods = ensure(uMods, is.String);
      const flags = ensure(uFlags, isPlayParams);
      const file = await bound.play({ mods, ...kebabToCamel(flags) });
      if (!file) {
        return;
      }
    },
  };
}
