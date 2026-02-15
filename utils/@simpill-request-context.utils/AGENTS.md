# request-context.utils

- **Layout:** `src/shared` (RequestContext type), `src/server` (AsyncLocalStorage store, runWithRequestContext, getRequestContext), `src/client` (stub getRequestContext).
- **No dependency on logger.utils** to avoid circular deps; README documents `setLogContextProvider(() => getRequestContext())` for integration.
- **Tests:** Unit tests for store run/runAsync/getStore, runWithRequestContext propagation, and type usage. 80%+ coverage.
- **Conventions:** Same as monorepo (Biome, Jest, strict TS, 400-line max per file).
