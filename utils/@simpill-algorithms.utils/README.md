## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2falgorithms.utils.svg)](https://www.npmjs.com/package/@simpill/algorithms.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-algorithms.utils)
</p>

**npm**
```bash
npm install @simpill/algorithms.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-algorithms.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-algorithms.utils` or `npm link` from that directory.

---

## Exports

- **Sorting**: `mergeSort`, `quickSort` — comparator `(a, b) => number` (negative = a < b, 0 = equal, positive = a > b). Both return a **new** array.
- **Binary search** (sorted array): `binarySearch`, `lowerBound`, `upperBound`.

## Usage

```ts
import {
  mergeSort,
  quickSort,
  binarySearch,
  lowerBound,
  upperBound,
  type CompareFn,
} from "@simpill/algorithms.utils";

const cmp: CompareFn<number> = (a, b) => a - b;

// Stable sort
const sorted = mergeSort([3, 1, 4, 1, 5], cmp); // [1, 1, 3, 4, 5]

// Binary search
const idx = binarySearch(sorted, 4, cmp); // 3 (or any index where value is 4)
const firstGe = lowerBound(sorted, 2, cmp); // first index where arr[i] >= 2
const firstGt = upperBound(sorted, 2, cmp); // first index where arr[i] > 2
```

### What we don't provide

- **In-place sort** — **mergeSort** and **quickSort** return a **new** array; they do not mutate the input. For in-place use **Array.prototype.sort** or another library.
- **Stability of quickSort** — **mergeSort** is stable; **quickSort** is not guaranteed stable.
- **Other algorithms** — No graph, heap, or other data-structure algorithms; only sorting and binary search on sorted arrays.

## Dependency note

This package does **not** depend on `@simpill/array.utils` or any other `@simpill` package. Other packages (e.g. `array.utils`, `data.utils`) may depend on `algorithms.utils` when they need stable sort or binary search.
