## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2farray.utils.svg)](https://www.npmjs.com/package/@simpill/array.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-array.utils)
</p>

**npm**
```bash
npm install @simpill/array.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-array.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-array.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  unique,
  chunk,
  compact,
  groupBy,
  sortBy,
  flattenOnce,
  partition,
  zip,
  keyBy,
  countBy,
  intersection,
  difference,
  union,
  sample,
  shuffle,
  take,
  drop,
} from "@simpill/array.utils";
```

## API Reference

- **Unique / compact:** `unique`, `uniqueBy`, `compact`
- **Chunking / flatten / windows:** `chunk`, `flattenOnce`, `windowed`
- **Grouping / keying:** `groupBy`, `keyBy`, `countBy`
- **Sorting:** `sortBy` (stable, single or multi-key, with `SortOrder`)
- **Partition / zip:** `partition`, `zip`, `zipWith`, `unzip`
- **Set-like:** `intersection`, `difference`, `union`, `symmetricDifference`
- **Aggregation:** `minBy`, `maxBy`, `sumBy`
- **Sampling / slice:** `sample`, `sampleSize`, `shuffle` (all take an optional seeded rng), `take`, `takeRight`, `drop`, `dropRight`
- **Generation:** `range`
- **First / last:** `first`, `last`
- **Guards:** `isArrayLike`, `isNonEmptyArray`, `ensureArray`

`unique`, `uniqueBy`, `compact`, `flattenOnce`, `groupBy`, `keyBy`, `countBy`, `partition`, `minBy`, `maxBy` and `sumBy` accept any `Iterable<T>` (arrays, generators, Sets), not just arrays.

Subpath exports: `@simpill/array.utils`, `@simpill/array.utils/client`, `@simpill/array.utils/server`, `@simpill/array.utils/shared`.
