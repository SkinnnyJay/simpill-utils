import type { FetchLike } from "../shared";
import { HttpTimeoutError } from "../shared/errors";

export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs: number;
}

/**
 * Fetch with a timeout. Aborts the underlying request at the deadline (with the
 * timeout error as the abort reason) and throws HttpTimeoutError (name "TimeoutError").
 * A caller-provided signal is composed: its abort reason is propagated to the request.
 * Note: manual AbortController composition is used deliberately — AbortSignal.any()
 * has known reliability issues with fetch in Node (nodejs/node#57736).
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutInit,
  fetchFn: FetchLike = fetch,
): Promise<Response> {
  const { timeoutMs, signal: inputSignal, ...rest } = init;
  const controller = new AbortController();
  const timeoutError = new HttpTimeoutError(timeoutMs);

  let abortListener: (() => void) | null = null;
  if (inputSignal) {
    if (inputSignal.aborted) {
      controller.abort(inputSignal.reason);
    } else {
      abortListener = () => controller.abort(inputSignal.reason);
      inputSignal.addEventListener("abort", abortListener, { once: true });
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);
    // Do not keep the Node event loop alive just for this deadline.
    (timer as unknown as { unref?: () => void }).unref?.();
  });

  const mergedInit: RequestInit = { ...rest, signal: controller.signal };
  try {
    return await Promise.race([fetchFn(input, mergedInit), timeoutPromise]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abortListener) inputSignal?.removeEventListener("abort", abortListener);
  }
}
