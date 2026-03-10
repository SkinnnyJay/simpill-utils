# resilience.utils

- Depends on `@simpill/async.utils` (Semaphore, delay).
- Layout: shared (withJitter, types), client (CircuitBreaker, RateLimiter, createBulkhead), server re-exports.
- Tests: unit tests for all four; 80%+ coverage.
