// deno-lint-ignore no-explicit-any
type Abortable = (signal: AbortSignal, ...args: any) => void | Promise<void>;

type Params<T extends Abortable> = T extends
  (signal: AbortSignal, ...args: infer P) => void ? P : never;

type Debounced<T extends Abortable> = (...args: Params<T>) => void;

function debounceWithAbort<T extends Abortable>(
  func: T,
  delay: number,
): Debounced<T> {
  const notif = new EventTarget();

  let timeoutId: number = 0;
  let running: Promise<void> | null = null;

  return (...args: Params<T>): void => {
    // debounce待機中のtimeoutをキャンセル
    clearTimeout(timeoutId);

    // 新しいdebounceタイマーを設定
    timeoutId = setTimeout(async () => {
      // 前の処理をキャンセル
      notif.dispatchEvent(new CustomEvent("abort"));

      // キャンセル用のイベントリスナーを設定
      const abort = new AbortController();
      const signal = abort.signal;
      notif.addEventListener("abort", () => {
        abort.abort();
      }, { signal });

      // 前の処理が完了するのを待つ
      if (running) {
        await running;
      }

      // 新しい処理を開始
      running = (async () => {
        try {
          await func(signal, ...args);
        } catch (error) {
          if (error.name === "AbortError") {
            // 中断が発生した場合はエラーを無視
            // noop
          } else {
            console.error(error);
          }
        } finally {
          // 待機する処理をリセット
          running = null;
        }
      })();
    }, delay);
  };
}

export { debounceWithAbort };
