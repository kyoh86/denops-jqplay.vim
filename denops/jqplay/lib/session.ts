import { v1 as uuid } from "jsr:@std/uuid@1.0.8";
import * as fn from "jsr:@denops/std@7.5.1/function";
import type { Denops } from "jsr:@denops/core@7.0";

export async function getNewSessionId(denops: Denops) {
  return await fn.fnameescape(denops, uuid.generate());
}
