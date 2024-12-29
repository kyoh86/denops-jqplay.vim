import type { Denops } from "jsr:@denops/core@7.0.1";
import type { Router } from "jsr:@kyoh86/denops-router@0.3.7";

import { emptyParamsTransform } from "./types.ts";
import { startBase } from "../base/start.ts";

export async function start(denops: Denops, router: Router, uParams: unknown) {
  await startBase(denops, router, uParams, "empty", emptyParamsTransform);
}
