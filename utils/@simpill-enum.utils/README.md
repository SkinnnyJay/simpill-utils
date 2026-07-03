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
import { getEnumValue, isValidEnumValue, getEnumKey, enumValues, assertEnumValue } from "@simpill/enum.utils";

const Status = { Active: "active", Inactive: "inactive" } as const;
const v = getEnumValue(Status, "active"); // "active"
const v2 = getEnumValue(Status, "unknown", Status.Inactive); // "inactive"
if (isValidEnumValue(Status, input)) { /* input is Status value */ }

// Real TypeScript enums — string, numeric, heterogeneous — all supported.
enum HttpStatus { OK = 200, NotFound = 404 }
isValidEnumValue(HttpStatus, 404);       // true
isValidEnumValue(HttpStatus, "NotFound"); // false — reverse-mapping keys are NOT values
getEnumKey(HttpStatus, 404);             // "NotFound" (reverse lookup, string enums too)
enumValues(HttpStatus);                  // [200, 404] — no reverse-mapping pollution
assertEnumValue(HttpStatus, input, "status"); // returns typed value or throws InvalidEnumValueError
```

Matching is strict (`===`): for numeric enums `0` is valid but `"0"` is not.
Member tables are cached per enum object (WeakMap), so validation and reverse
lookup are O(1) and allocation-free after the first call.

---

## Features

| Feature | Description |
|---------|-------------|
| **getEnumValue** | Get enum value with optional default. Works with string, numeric, heterogeneous enums and `as const` objects. |
| **isValidEnumValue** | Type guard: `value is T[keyof T]`. Accepts `unknown`; reverse-mapping safe. |
| **getEnumKey** | Reverse lookup (value → member key) with optional default — works for string enums, which have no compiled reverse mapping. |
| **isEnumKey** | Type guard for member keys. Rejects reverse-mapping keys and prototype properties. |
| **enumValues / enumKeys / enumEntries** | Iterate members without the numeric-enum `Object.values` trap (TS#57134). Fresh arrays per call; cached tables internally. |
| **assertEnumValue** | Validate-or-throw. Throws `InvalidEnumValueError` carrying `received` + `allowed` and a message listing valid values. |
| **EnumHelper** | Namespace with all of the above. |

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
- **isValidEnumValue**&lt;T&gt;(enumObj, value: unknown) → value is T[keyof T]
- **getEnumKey**&lt;T&gt;(enumObj, value) → (keyof T & string) | undefined
- **getEnumKey**&lt;T&gt;(enumObj, value, defaultKey) → keyof T & string
- **isEnumKey**&lt;T&gt;(enumObj, key: unknown) → key is keyof T & string
- **enumValues**&lt;T&gt;(enumObj) → T[keyof T][]
- **enumKeys**&lt;T&gt;(enumObj) → (keyof T & string)[]
- **enumEntries**&lt;T&gt;(enumObj) → [keyof T & string, T[keyof T]][]
- **assertEnumValue**&lt;T&gt;(enumObj, value: unknown, label?) → T[keyof T] (throws **InvalidEnumValueError**)
- **InvalidEnumValueError** — Error with `.received` and `.allowed`
- **EnumHelper** — namespace with all helpers

### Notes

- **Numeric enums**: compiled numeric enums carry reverse mappings (`{ A: 0, "0": "A" }`). All helpers filter these, so member *names* are never accepted as *values* and iteration never yields reverse-mapping artifacts.
- **Strictness**: no coercion. `"200"` does not match `200`. Normalize inputs yourself if needed.
- **Schema validation** — For Zod enums or runtime validation use **@simpill/zod.utils** (e.g. **enumFromList**) or **@simpill/data.utils**.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | getEnumValue, isValidEnumValue, reverse lookup, iteration |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
