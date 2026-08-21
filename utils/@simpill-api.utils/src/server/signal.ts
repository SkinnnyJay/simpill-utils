/**
 * Compose multiple AbortSignals into one: the returned signal aborts as soon
 * as any input aborts, propagating the first abort reason.
 *
 * Implemented manually (not via AbortSignal.any) because:
 * - engines allows Node >= 16; AbortSignal.any landed in Node 20.3
 * - nodejs/node#57736: AbortSignal.any-derived signals intermittently fail
 *   to abort fetch (confirmed bug), plus leak reports in #54614 / #57584
 *
 * Listeners are removed once any signal fires, so long-lived signals do not
 * accumulate handlers across requests.
 */
export function composeSignals(
  ...signals: Array<AbortSignal | undefined | null>
): AbortSignal | undefined {
  const present = signals.filter((s): s is AbortSignal => s != null);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];

  const controller = new AbortController();
  const cleanups: Array<() => void> = [];
  const abort = (reason: unknown) => {
    for (const c of cleanups) c();
    cleanups.length = 0;
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  };
  for (const s of present) {
    if (s.aborted) {
      abort(s.reason);
      return controller.signal;
    }
    const onAbort = () => abort(s.reason);
    s.addEventListener("abort", onAbort, { once: true });
    cleanups.push(() => s.removeEventListener("abort", onAbort));
  }
  return controller.signal;
}
