<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/enum.utils" width="100%" />
</p>

<p align="center">
  <strong>Enum helpers: getEnumValue, isValidEnumValue, EnumHelper</strong>
</p>

<p align="center">
  Type-safe enum helpers: getEnumValue, isValidEnumValue, EnumHelper.
</p>

**Features:** Type-safe · Node & Edge · Lightweight. The legacy **utils/enum/** folder is deprecated; use **@simpill/enum.utils** only.

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

## Installation

```bash
npm install @simpill/enum.utils
```

---

## Quick Start

```typescript
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

```typescript
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

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
