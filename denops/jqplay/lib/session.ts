import { v1 as uuid } from "jsr:@std/uuid@1.0.9";
import * as fn from "jsr:@denops/std@8.0.0/function";
import type { Denops } from "jsr:@denops/core@8.0";

export async function getNewSessionId(denops: Denops) {
  return await fn.fnameescape(denops, uuid.generate());
}
