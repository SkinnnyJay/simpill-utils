import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 * `useLayoutEffect` does nothing on the server and React warns loudly when it
 * is rendered there; this alias silences the warning without changing browser
 * behavior. Standard utility in every major hooks library (react-use, ahooks,
 * usehooks-ts).
 */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;
