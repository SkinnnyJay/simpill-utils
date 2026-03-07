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

- **Clamp / range:** `clamp`, `isInRange` (with `IsInRangeOptions`)
- **Rounding:** `roundTo`
- **Parsing:** `toInt`, `toFloat`
- **Math:** `lerp`, `sum`, `avg`
- **Guards:** `isInteger`, `isFiniteNumber`
- **Random:** `randomInt`

Subpath exports: `@simpill/number.utils`, `@simpill/number.utils/client`, `@simpill/number.utils/server`, `@simpill/number.utils/shared`.
