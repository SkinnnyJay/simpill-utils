## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fenum.utils.svg)](https://www.npmjs.com/package/@simpill/enum.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-enum.utils)
</p>

**npm**
```bash
npm install @simpill/enum.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-enum.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-enum.utils` or `npm link` from that directory.

---

## Usage

```ts
import { getEnumValue, isValidEnumValue } from "@simpill/enum.utils";

const Status = { Active: "active", Inactive: "inactive" } as const;
const v = getEnumValue(Status, "active"); // "active"
const v2 = getEnumValue(Status, "unknown", Status.Inactive); // "inactive"
if (isValidEnumValue(Status, input)) { /* input is Status value */ }
```

---

## Features

| Feature | Description |
|---------|-------------|
| **getEnumValue** | Get enum value with optional default (string enums only). Use generic for typed result: `getEnumValue<MyEnum>(obj, key)` or `getEnumValue<MyEnum>(obj, key, default)`. |
| **isValidEnumValue** | Type guard: `value is T[keyof T]` when used as `isValidEnumValue<MyEnum>(enumObj, value)`. |
| **EnumHelper** | Namespace with getEnumValue, isValidEnumValue |

---

## Import Paths

```ts
import { ... } from "@simpill/enum.utils";         // Everything
import { ... } from "@simpill/enum.utils/client";  // Client
import { ... } from "@simpill/enum.utils/server"; // Server
import { ... } from "@simpill/enum.utils/shared"; // Shared only
```

---

## API Reference

- **getEnumValue**&lt;T&gt;(enumObj, value) → T[keyof T] | undefined
- **getEnumValue**&lt;T&gt;(enumObj, value, defaultValue) → T[keyof T]
- **isValidEnumValue**&lt;T&gt;(enumObj, value) → value is T[keyof T]
- **EnumHelper** — { getEnumValue, isValidEnumValue }

### What we don't provide

- **Numeric enums** — Helpers target **string** enums (const objects or TypeScript string enums). For numeric enums use direct comparison or a small wrapper.
- **Reverse lookup / iteration** — No “key from value” or “all values”; use **Object.values(enumObj)** or **Object.entries(enumObj)** as needed.
- **Schema validation** — For Zod enums or runtime validation use **@simpill/zod.utils** (e.g. **enumFromList**) or **@simpill/data.utils**.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | getEnumValue, isValidEnumValue |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
