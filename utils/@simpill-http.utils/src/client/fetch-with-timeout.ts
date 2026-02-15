import { raceWithTimeout } from "@simpill/async.utils";
import type { FetchLike } from "../shared";

export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs: number;
}

/**
 * Fetch with a timeout. Uses AbortController to abort the request when the timeout fires.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutInit,
  fetchFn: FetchLike = fetch,
): Promise<Response> {
  const { timeoutMs, signal: inputSignal, ...rest } = init;
  const controller = new AbortController();
  const timeoutSignal = controller.signal;
  let abortListener: (() => void) | null = null;
  if (inputSignal) {
    if (inputSignal.aborted) {
      controller.abort();
    } else {
      abortListener = () => controller.abort();
      inputSignal.addEventListener("abort", abortListener, { once: true });
    }
  }
  const mergedInit: RequestInit = { ...rest, signal: timeoutSignal };

  const promise = fetchFn(input, mergedInit);
  const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);

  try {
    const response = await raceWithTimeout(promise, timeoutMs, timeoutError);
    return response;
  } catch (err) {
    controller.abort();
    throw err;
  } finally {
    if (abortListener) {
      inputSignal?.removeEventListener("abort", abortListener);
    }
  }
}
