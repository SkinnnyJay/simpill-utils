## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fzod.utils.svg)](https://www.npmjs.com/package/@simpill/zod.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-zod.utils)
</p>

**npm**
```bash
npm install @simpill/zod.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-zod.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-zod.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  safeParseResult,
  flattenZodError,
  stringField,
  numberField,
  trimString,
  lowerString,
} from "@simpill/zod.utils";
import { z } from "zod";

const UserSchema = z.object({
  name: trimString(z.string()),
  email: lowerString(z.string().email()),
  age: numberField(z.number(), 0),
});

const result = safeParseResult(UserSchema, input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(flattenZodError(result.error));
}
```

## Subpath exports

- `@simpill/zod.utils` – all exports
- `@simpill/zod.utils/shared` – runtime-agnostic helpers
- `@simpill/zod.utils/client` – client-only (if any)
- `@simpill/zod.utils/server` – server-only (if any)

## API

- **Schema builders**: `stringField`, `numberField`, `booleanField`, `optionalWithDefault`, `nullableWithDefault`
- **Safe-parse**: `safeParseResult`, `parseOrThrow`, `flattenZodError`, `formatZodError`
- **Transforms**: `trimString`, `lowerString`, `upperString`, `coerceOptionalString`, `pipeTransforms`
- **Common schemas**: `nonEmptyString`, `isoDateString`, `isoDateOnlyString`, `enumFromList`, `coerceString`
- **Request/query**: `coerceQueryNumber`, `coerceQueryBoolean`, `paginationSchema`, `offsetPaginationSchema`, `idParamNumber`, `idParamUuid`
- **API errors**: `toValidationError`, `parseOrThrowValidation`, `ValidationErrorPayload` (for 400 responses)
- **OpenAPI**: `withOpenApiMetadata` (optional peer: zod-openapi)

### What we don't provide

- **Zod replacement** — This package extends Zod; **zod** is a required peer. We do not reimplement parsing or validation.
- **OpenAPI spec generation** — **withOpenApiMetadata** attaches metadata for zod-openapi; we do not emit OpenAPI JSON/YAML. Use **zod-to-openapi** or similar to generate specs.
- **Non-Zod validation** — For simple validators without Zod use **@simpill/data.utils** (validateString, validateNumber, ValidationResult).

## License

ISC
