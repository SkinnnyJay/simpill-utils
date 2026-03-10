# http.utils

- Depends on `@simpill/async.utils` (retry, raceWithTimeout).
- Layout: shared (types, isRetryableStatus), client (fetchWithTimeout, fetchWithRetry, createHttpClient), server re-exports client.
- Tests: mock fetch for timeout/retry/client; 80%+ coverage.
