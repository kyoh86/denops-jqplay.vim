// deno-lint-ignore no-explicit-any
type Abortable = (signal: AbortSignal, ...args: any) => void;

type ParametersWithoutSignal<T extends Abortable> = T extends
  (signal: AbortSignal, ...args: infer P) => void ? P : never;

type DebouncedFunction<T extends Abortable> = (
  ...args: ParametersWithoutSignal<T>
) => void;

export function debounceWithAbort<T extends Abortable>(
  func: T,
  delay: number,
): DebouncedFunction<T> {
  let timeoutId: number | null = null;
  let currentController: AbortController | null = null;

  return (...args: ParametersWithoutSignal<T>): void => {
    // 以前のタイマーをクリア
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // 以前のリクエストをキャンセル
    if (currentController) {
      currentController.abort();
    }

    // 新しいAbortControllerを作成
    currentController = new AbortController();
    const signal = currentController.signal;

    // 新しいタイマーを設定
    timeoutId = setTimeout(() => {
      try {
        // 非同期関数を呼び出す
        func(signal, ...args);
      } finally {
        // タイマーとコントローラをリセット
        timeoutId = null;
        currentController = null;
      }
    }, delay);
  };
}
