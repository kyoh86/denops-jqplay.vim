// deno-lint-ignore no-explicit-any
type Abortable = (signal: AbortSignal, ...args: any) => void | Promise<void>;

type ParametersWithoutSignal<T extends Abortable> = T extends
  (signal: AbortSignal, ...args: infer P) => void ? P : never;

type DebouncedFunction<T extends Abortable> = (
  ...args: ParametersWithoutSignal<T>
) => void;

export function debounceWithAbort<T extends Abortable>(
  func: T,
  delay: number,
): DebouncedFunction<T> {
  const subscriber = new EventTarget();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;

  return (...args: ParametersWithoutSignal<T>): void => {
    // 以前のタイマーをクリア
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // 以前のリクエストをキャンセル
    subscriber.dispatchEvent(new CustomEvent("abort"));

    // 新しいタイマーを設定
    timeoutId = setTimeout(async () => {
      const controller = new AbortController();
      const signal = controller.signal;

      // イベントリスナーを設定
      subscriber.addEventListener("abort", () => controller.abort(), {
        signal,
      });

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
            throw error;
          }
        } finally {
          // タイマーとコントローラをリセット
          timeoutId = null;
          running = null;
        }
      })();
    }, delay);
  };
}
