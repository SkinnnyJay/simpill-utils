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

## API (summary)

- **Getters with defaults:** `Env.getString`, `Env.getNumber`, `Env.getBoolean`, `Env.getArray`, `Env.getJson`
- **Required (throws if missing):** `Env.getRequired`, `Env.getRequiredNumber`, `Env.getRequiredBoolean`
- **Utility:** `Env.has`, `Env.isProduction`, `Env.isDevelopment`, `Env.refresh`
- **Encryption (dotenvx):** `Env.isEncrypted`, `Env.getDecrypted`, `Env.hasPrivateKey`
- **Bootstrap:** `Env.bootstrap({ envPaths, overload?, overrides?, dynamic? })`

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
