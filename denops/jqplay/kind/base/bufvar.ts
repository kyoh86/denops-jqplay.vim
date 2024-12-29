import type { Denops } from "jsr:@denops/std@7.4.0";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import * as buffer from "jsr:@denops/std@7.4.0/buffer";
import * as variable from "jsr:@denops/std@7.4.0/variable";

export type BufVars = { session: string };

export async function getBufVars(denops: Denops, bufnr: number): Promise<BufVars> {
  const get = async (name: string) =>
    ensure(await variable.b.get(denops, name), is.String);
  return await buffer.ensure(denops, bufnr, async () => {
    return {
      session: await get("jqplay_session"),
    };
  });
}

export async function setBufVars(denops: Denops, bufnr: number, vars: BufVars) {
  await buffer.ensure(denops, bufnr, async () => {
    await variable.b.set(denops, "jqplay_session", vars.session);
  });
}

