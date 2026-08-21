# CLAUDE.md – @simpill/array.utils

## Purpose

Comprehensive, type-safe array utility functions covering guards, deduplication, transformation, grouping, set operations, and random sampling. All functions are pure and return new arrays; no inputs are mutated.

## Commands

From `utils/@simpill-array.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/array.utils` – all exports
- **Shared**: `@simpill/array.utils/shared` – all array helpers
- **Client / Server**: re-export shared (no runtime-specific code)

### Functions

| Export | Description |
|--------|-------------|
| `isNonEmptyArray<T>(value)` | Type guard: non-empty array `[T, ...T[]]` |
| `isArrayLike<T>(value)` | Type guard: any array (possibly empty) |
| `unique<T>(array)` | Dedupe by reference; preserves first occurrence |
| `uniqueBy<T, K>(array, keyFn)` | Dedupe by computed key |
| `chunk<T>(array, size)` | Split into chunks of given size |
| `compact<T>(array)` | Remove `null` and `undefined` |
| `flattenOnce<T>(array)` | Flatten one level |
| `groupBy<T, K>(array, keyFn)` | `Map<K, T[]>` grouped by key |
| `sortBy<T, K>(array, keyFn, order?)` | Sort by key, asc or desc |
| `partition<T>(array, predicate)` | `[matches, rest]` by predicate |
| `ensureArray<T>(value)` | Wrap single value in array; null/undefined → `[]` |
| `first<T>(array)` | First element or `undefined` |
| `last<T>(array)` | Last element or `undefined` |
| `take<T>(array, n)` | First n elements |
| `drop<T>(array, n)` | Skip first n elements |
| `takeRight<T>(array, n)` | Last n elements |
| `dropRight<T>(array, n)` | Skip last n elements |
| `zip<A, B>(a, b)` | Pair two arrays; length = min |
| `unzip<A, B>(pairs)` | Split pairs back into two arrays |
| `keyBy<T, K>(array, keyFn)` | `Map<K, T>` first-occurrence index |
| `countBy<T, K>(array, keyFn)` | `Map<K, number>` occurrence counts |
| `intersection<T>(a, b)` | Elements in both arrays |
| `difference<T>(a, b)` | Elements in `a` not in `b` |
| `union<T>(a, b)` | All unique elements from both |
| `sample<T>(array)` | Random element or `undefined` |
| `shuffle<T>(array)` | Fisher–Yates shuffle; returns new array |
| `SortOrder` | `"asc" \| "desc"` |

## Usage Examples

```typescript
import { chunk, groupBy, partition, unique } from "@simpill/array.utils";

unique([1, 2, 2, 3]);                         // [1, 2, 3]
chunk([1, 2, 3, 4, 5], 2);                    // [[1,2],[3,4],[5]]
partition([1, 2, 3, 4], (n) => n % 2 === 0);  // [[2,4], [1,3]]

const byRole = groupBy(users, (u) => u.role); // Map<Role, User[]>
```

## Architecture Notes

- **Runtime**: `shared/` only – no Node.js or browser APIs; works in Edge Runtime.
- Both `client/` and `server/` are thin re-exports of `shared/`.
- No side effects (`sideEffects: false`).

## Dependencies

None (no runtime dependencies). Dev-only: TypeScript, Jest, Biome.

## Key Design Decisions

- **Immutable**: every function returns a new array or new Map; inputs are never mutated.
- **`groupBy` / `keyBy` return `Map`** (not plain objects) to support non-string keys and preserve insertion order.
- **`compact`** removes only `null` and `undefined` (not `0`, `""`, or `false`) to avoid surprises.
- **`sample` / `shuffle`** use `Math.random()`; not cryptographically secure — use `@simpill/crypto.utils` when security matters.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
