<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/array.utils" width="100%" />
</p>

<p align="center">
  <strong>Array utilities: unique, chunk, compact, groupBy, sortBy, flattenOnce</strong>
</p>

<p align="center">
  Type-safe array helpers for Node and Edge. No dependencies on other @simpill packages.
</p>

**Features:** Type-safe · Node & Edge · Tree-shakeable · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## Installation

```bash
npm install @simpill/array.utils
```

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
- **Chunking / flatten:** `chunk`, `flattenOnce`
- **Grouping / keying:** `groupBy`, `keyBy`, `countBy`
- **Sorting:** `sortBy` (with `SortOrder`)
- **Partition / zip:** `partition`, `zip`, `unzip`
- **Set-like:** `intersection`, `difference`, `union`
- **Sampling / slice:** `sample`, `shuffle`, `take`, `takeRight`, `drop`, `dropRight`
- **First / last:** `first`, `last`
- **Guards:** `isArrayLike`, `isNonEmptyArray`, `ensureArray`

Subpath exports: `@simpill/array.utils`, `@simpill/array.utils/client`, `@simpill/array.utils/server`, `@simpill/array.utils/shared`.
