## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fnumber.utils.svg)](https://www.npmjs.com/package/@simpill/number.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-number.utils)
</p>

**npm**
```bash
npm install @simpill/number.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-number.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-number.utils` or `npm link` from that directory.

---

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

- **Clamp / range:** `clamp` (TC39 Math.clamp semantics: NaN propagates, `min > max` throws RangeError), `isInRange` (with `IsInRangeOptions`)
- **Rounding:** `roundTo` — exponent-shift rounding, so `roundTo(1.005, 2) === 1.01`; supports negative decimals (`roundTo(4560, -2) === 4600`) and banker's rounding via `{ mode: "half-even" }` (`RoundToOptions`)
- **Parsing:** `toInt`, `toFloat` — accept numbers, numeric strings, and exact bigints; `""`, `null`, arrays, booleans, and objects hit the fallback instead of coercing to `0`/`1`; `toInt` truncates toward zero
- **Interpolation:** `lerp` (C++20 `std::lerp` guarantees: exact at `t=0`/`t=1`, monotonic, bounded), `inverseLerp`, `remap`
- **Summation:** `sum` (Neumaier compensated — `sum(Array(10).fill(0.1)) === 1`), `sumPrecise` (correctly rounded, ES2026 `Math.sumPrecise` semantics; native when available), `avg`
- **Comparison:** `approxEqual` (PEP 485 `math.isclose` semantics, `ApproxEqualOptions`)
- **Guards:** `isInteger`, `isFiniteNumber`
- **Random:** `randomInt` — validated bounds (RangeError on empty/reversed integer ranges); `Math.random`-based, not for security

Subpath exports: `@simpill/number.utils`, `@simpill/number.utils/client`, `@simpill/number.utils/server`, `@simpill/number.utils/shared`.
