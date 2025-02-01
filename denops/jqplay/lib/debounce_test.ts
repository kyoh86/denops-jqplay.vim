import { assert } from "jsr:@std/assert@1.0.11";
import { debounceWithAbort } from "./debounce.ts";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test("withAbort function should debounce calls ", async () => {
  let callCount = 0;

  const mockFunction = async (signal: AbortSignal, value: string) => {
    callCount++;
    await delay(200); // Simulate some async work

    if (signal.aborted) {
      return;
    }

    console.log(value);
  };

  const debouncedFunction = debounceWithAbort(mockFunction, 400);

  debouncedFunction("first call");
  debouncedFunction("second call");

  await delay(800); // Wait enough time for debounce to trigger and finish it

  debouncedFunction("third call");

  await delay(1000); // Wait enough time for debounce but not to finish

  assert(callCount === 2, `Expected 2 calls, but got ${callCount}`);
});

Deno.test("withAbort function should debounce calls and handle abort signal", async () => {
  let callCount = 0;
  let finishCount = 0;

  const mockFunction = async (signal: AbortSignal, value: string) => {
    if (signal.aborted) {
      return;
    }

    callCount++;
    await delay(400); // Simulate some async work

    if (signal.aborted) {
      return;
    }

    finishCount++;

    console.log(value);
  };

  const debouncedFunction = debounceWithAbort(mockFunction, 200);

  debouncedFunction("first call");
  debouncedFunction("second call");

  await delay(800); // Wait enough time for debounce to trigger and finish it

  debouncedFunction("third call");

  await delay(300); // Wait enough time for debounce but not to finish

  debouncedFunction("fourth call");
  debouncedFunction("fifth call");

  await delay(1000); // Wait enough time for debounce to trigger

  assert(callCount === 3, `Expected 3 calls, but got ${callCount}`);
  assert(
    finishCount === 2,
    `Expected 2 finishes, but got ${finishCount}`,
  );
});
