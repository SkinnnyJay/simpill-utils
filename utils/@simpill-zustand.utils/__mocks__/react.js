// Minimal mock so zustand (which requires react when using create from main) loads in Node tests.
module.exports = {
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  useCallback: (fn) => fn,
  useRef: (v) => ({ current: v }),
  useEffect: () => {
    /* noop for tests */
  },
  useState: (v) => [
    v,
    () => {
      /* noop */
    },
  ],
};
