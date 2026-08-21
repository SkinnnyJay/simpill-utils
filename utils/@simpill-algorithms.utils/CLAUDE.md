# CLAUDE.md – @simpill/algorithms.utils

## Purpose

Pure, dependency-free sorting and search algorithms for sorted arrays. All functions are generic and accept a comparator so they work with any orderable type. No `@simpill` dependencies.

## Commands

From `utils/@simpill-algorithms.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/algorithms.utils` – all exports
- **Shared**: `@simpill/algorithms.utils/shared` – all algorithm functions
- **Client / Server**: re-export shared (no runtime-specific code)

### Functions

| Export | Description |
|--------|-------------|
| `mergeSort<T>(array, compare)` | Stable O(n log n) sort; returns new array |
| `quickSort<T>(array, compare)` | Non-stable O(n log n) sort; returns new array |
| `binarySearch<T>(array, value, compare)` | Index in sorted array, or -1 |
| `lowerBound<T>(array, value, compare)` | First index where `array[i] >= value` |
| `upperBound<T>(array, value, compare)` | First index where `array[i] > value` |
| `CompareFn<T>` | `(a: T, b: T) => number` comparator type |

## Usage Examples

```typescript
import { mergeSort, binarySearch, lowerBound } from "@simpill/algorithms.utils";

const nums = [3, 1, 4, 1, 5, 9, 2];
const cmp = (a: number, b: number) => a - b;

const sorted = mergeSort(nums, cmp);       // [1, 1, 2, 3, 4, 5, 9] – original untouched
const idx    = binarySearch(sorted, 4, cmp); // 4
const lo     = lowerBound(sorted, 1, cmp);   // 0 (first 1)
const hi     = upperBound(sorted, 1, cmp);   // 2 (first element > 1)
```

## Architecture Notes

- **Runtime**: `shared/` only – pure TypeScript, no Node.js or browser APIs.
- Both `client/` and `server/` are thin re-exports of `shared/`.
- No side effects (`sideEffects: false`).

## Dependencies

None (no runtime dependencies). Dev-only: TypeScript, Jest, Biome.

## Key Design Decisions

- **Immutable**: every function returns a new array; the input is never mutated.
- **Comparator-based**: no special-casing for numbers/strings; callers supply `(a,b)=>number`.
- **`mergeSort` is stable**: preserves the relative order of equal elements; prefer it when stability matters.
- **`quickSort` is not stable** but has lower overhead for large, unsorted inputs.
- **`lowerBound` / `upperBound`**: STL-style bisect; useful for range queries on sorted arrays.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
