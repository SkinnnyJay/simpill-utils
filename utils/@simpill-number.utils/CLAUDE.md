# CLAUDE.md – @simpill/number.utils

## Purpose

Type-safe number helpers for validation, coercion, clamping, interpolation, and aggregation. All functions handle edge cases (NaN, Infinity, non-numeric input) explicitly rather than propagating bad values.

## Commands

From `utils/@simpill-number.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/number.utils` – all exports
- **Shared**: `@simpill/number.utils/shared` – all number helpers
- **Client / Server**: re-export shared (no runtime-specific code)

### Functions

| Export | Description |
|--------|-------------|
| `isFiniteNumber(value)` | Type guard: finite number (excludes NaN, ±Infinity) |
| `isInteger(value)` | Type guard: integer number |
| `clamp(value, min, max)` | Constrain value to [min, max] |
| `roundTo(value, decimals)` | Round to given decimal places |
| `toInt(value, fallback?)` | Parse to integer; fallback (default 0) on NaN/invalid |
| `toFloat(value, fallback?)` | Parse to float; fallback (default 0) on NaN/invalid |
| `isInRange(value, min, max, options?)` | True if value is in range; `inclusive` (default true) |
| `randomInt(min, max)` | Random integer in [min, max] inclusive |
| `lerp(a, b, t)` | Linear interpolation: `(1-t)*a + t*b` |
| `sum(values)` | Sum of array of numbers |
| `avg(values)` | Average; returns 0 for empty array |
| `IsInRangeOptions` | `{ inclusive?: boolean }` |

## Usage Examples

```typescript
import { clamp, isFiniteNumber, lerp, roundTo, toInt } from "@simpill/number.utils";

isFiniteNumber(NaN);            // false
isFiniteNumber(42);             // true

clamp(150, 0, 100);             // 100
clamp(-5, 0, 100);              // 0

roundTo(3.14159, 2);            // 3.14

toInt("42.9");                  // 42
toInt("bad", -1);               // -1

lerp(0, 100, 0.25);             // 25
```

## Architecture Notes

- **Runtime**: `shared/` only – pure TypeScript, no Node.js or browser APIs.
- Both `client/` and `server/` are thin re-exports of `shared/`.
- No side effects (`sideEffects: false`).

## Dependencies

None (no runtime dependencies). Dev-only: TypeScript, Jest, Biome.

## Key Design Decisions

- **`isFiniteNumber`** uses `Number.isFinite` not `isFinite` — the global `isFinite` coerces strings, the Number method does not.
- **`toInt` / `toFloat`** accept `unknown` (not `string | number`) so they can safely handle values from untyped APIs without casting.
- **`avg`** returns 0 for an empty array rather than NaN to avoid propagating NaN through downstream calculations.
- **`randomInt`** is not cryptographically secure; use `@simpill/crypto.utils` for security-sensitive random numbers.
- **`isInRange`** defaults to inclusive bounds; pass `{ inclusive: false }` for open-interval checks.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
