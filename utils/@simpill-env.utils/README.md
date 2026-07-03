## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fenv.utils.svg)](https://www.npmjs.com/package/@simpill/env.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-env.utils)
</p>

**npm**
```bash
npm install @simpill/env.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-env.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-env.utils` or `npm link` from that directory.

---

Type-safe environment variable getters for Node.js and Edge. No more `process.env.PORT || 3000` strings or silent `NaN`.

## Usage

**Node.js**

```ts
import { Env } from "@simpill/env.utils";

Env.bootstrap({ envPaths: [".env", ".env.local"], overload: true });

const port = Env.getNumber("PORT", 3000);
const debug = Env.getBoolean("DEBUG", false);
const apiKey = Env.getRequired("API_KEY");
const logLevel = Env.getEnum("LOG_LEVEL", ["debug", "info", "warn", "error"], "info");
```

**Edge Runtime**

```ts
import { getEdgeString, getEdgeNumber, getEdgeBoolean } from "@simpill/env.utils/client";

const apiKey = getEdgeString("API_KEY", "");
const maxRetries = getEdgeNumber("MAX_RETRIES", 3);
```

## Import paths

```ts
import { ... } from "@simpill/env.utils";         // Everything
import { ... } from "@simpill/env.utils/server";  // Node (Env, EnvManager, bootstrap)
import { ... } from "@simpill/env.utils/client";  // Edge (getEdge*)
import { ... } from "@simpill/env.utils/shared";  // Shared parsers/types
```

## Schema validation — `createEnv`

Declare every variable once, get a fully typed, frozen object back. **Every**
missing/invalid variable is reported in a single aggregate `EnvSchemaError`
(not just the first), and secret-like values (`*_KEY`, `*TOKEN*`,
`*PASSWORD*`, `DATABASE_URL`, ...) are redacted from error messages.

```ts
import { createEnv } from "@simpill/env.utils"; // also on /client — Edge-safe

const env = createEnv({
  PORT: { type: "port" },                                   // integer 1–65535
  DATABASE_URL: { type: "url", description: "primary Postgres DSN" },
  LOG_LEVEL: { type: "enum", values: ["debug", "info", "warn", "error"], default: "info" },
  DEBUG: { type: "boolean", default: false },               // strict: true/false/1/0
  MAX_RETRIES: { type: "integer", min: 0, max: 10, default: 3 },
  SENTRY_DSN: { type: "url", required: false },             // string | undefined
  ORIGINS: { type: "array" },                               // comma-separated
  FLAGS: { type: "json" },
});

env.PORT;      // number
env.LOG_LEVEL; // "debug" | "info" | "warn" | "error"
```

Types: `string` (choices/pattern/validate) · `number` / `integer` (min/max/validate) ·
`boolean` · `enum` · `port` · `url` (protocol allowlist) · `json` · `array` (separator).
A variable is required unless it has a `default` or `required: false`; empty
string counts as unset. Output is `Object.freeze`d — immutable without a Proxy
wrapper, so `structuredClone` works. Options: `source` (defaults to
`process.env`), `reporter` (receive issues instead of throwing), `redactAll`,
per-entry `secret: true`.

## Secret redaction

`EnvParseError` / `EnvValidationError` / `EnvSchemaError` never embed values
for secret-like keys — the message **and** the stored `rawValue`/`value` carry
`[redacted]` instead, so serialized errors are safe for logs and crash
reporters. Exposed as `redactEnvValue` / `isSecretLikeKey` / `REDACTED_VALUE`.

## API (summary)

- **Getters with defaults:** `Env.getString`, `Env.getNumber`, `Env.getBoolean`, `Env.getArray`, `Env.getJson`
- **Required (throws if missing):** `Env.getRequired`, `Env.getRequiredNumber`, `Env.getRequiredBoolean`
- **Utility:** `Env.has`, `Env.isProduction`, `Env.isDevelopment`, `Env.refresh`
- **Encryption (dotenvx):** `Env.isEncrypted`, `Env.getDecrypted`, `Env.hasPrivateKey`
- **Bootstrap:** `Env.bootstrap({ envPaths, overload?, overrides?, dynamic? })`
- **Schema:** `createEnv(spec, options?)` — typed, aggregate-error, secret-redacted (Node + Edge)

## Notes

- `extendProcessEnvPrototype()` (deprecated) now actually works on the real
  `process.env`: the previous `Object.assign` was stringified by Node's env
  setter, so the helpers threw `not a function` outside test runners that
  replace `process.env` with a plain object. Helpers now live on a prototype —
  callable, non-enumerable, and never inherited by child process environments.
  `unextendProcessEnvPrototype()` removes them.
- Number/boolean parsing treats whitespace-only values as unset (`Number(" ")
  === 0` no longer sneaks a zero past strict parsing) and boolean values are
  trimmed (`DEBUG=true ` parses).

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
