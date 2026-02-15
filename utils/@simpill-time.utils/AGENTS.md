# @simpill/time.utils – Agent guidelines

## Structure

- **src/shared/** – date-time helpers; debounce/throttle re-exported from `@simpill/function.utils` (canonical).
- **src/server/** – IntervalManager, createManagedInterval, createManagedTimeout, createTimerFactory (canonical implementation).
- **src/client** – Re-export shared (date-time, debounce, throttle).
- **__tests__/shared/unit/** – Unit tests for date-time and debounce/throttle.

## Re-export strategy

- debounce, throttle, CancellableFunction, ThrottleOptions: re-exported from function.utils. No local implementation.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
