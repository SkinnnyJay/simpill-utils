<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/number.utils" width="100%" />
</p>

<p align="center">
  <strong>Number utilities: clamp, roundTo, toInt/Float, isInRange, lerp, sum, avg</strong>
</p>

<p align="center">
  Type-safe number helpers for Node and Edge. No dependencies on other @simpill packages.
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
npm install @simpill/number.utils
```

## Usage

```ts
import {
  clamp,
  roundTo,
  toInt,
  toFloat,
  isInRange,
  lerp,
  sum,
  avg,
  isInteger,
  isFiniteNumber,
  randomInt,
} from "@simpill/number.utils";
```

## API Reference

- **Clamp / range:** `clamp`, `isInRange` (with `IsInRangeOptions`)
- **Rounding:** `roundTo`
- **Parsing:** `toInt`, `toFloat`
- **Math:** `lerp`, `sum`, `avg`
- **Guards:** `isInteger`, `isFiniteNumber`
- **Random:** `randomInt`

Subpath exports: `@simpill/number.utils`, `@simpill/number.utils/client`, `@simpill/number.utils/server`, `@simpill/number.utils/shared`.
