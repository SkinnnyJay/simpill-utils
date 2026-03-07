## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fprotocols.utils.svg)](https://www.npmjs.com/package/@simpill/protocols.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-protocols.utils)
</p>

**npm**
```bash
npm install @simpill/protocols.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-protocols.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-protocols.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  HTTP_METHOD,
  type HttpMethod,
  CORRELATION_HEADERS,
  ENV_BOOLEAN_PARSING,
  LOG_ENV_KEYS,
  LOG_FORMAT_VALUES,
} from "@simpill/protocols.utils";
```

## Exports

- **HTTP**: `HTTP_METHOD`, `HttpMethod` — GET, POST, PUT, PATCH, DELETE
- **Correlation**: `CORRELATION_HEADERS` — `x-request-id`, `x-trace-id`
- **Env boolean**: `ENV_BOOLEAN_PARSING` — strict truthy `["true","1"]`, falsy `["false","0"]`
- **Log env**: `LOG_ENV_KEYS`, `LOG_FORMAT_VALUES` — keys and values for logger configuration

## Subpath exports

- `@simpill/protocols.utils` — all
- `@simpill/protocols.utils/shared` — same (package is shared-only)
- `@simpill/protocols.utils/client` — re-exports shared
- `@simpill/protocols.utils/server` — re-exports shared

### What we don't provide

- **Runtime behavior** — Constants and types only; no env parsing, no HTTP client, no logger implementation. Use **@simpill/env.utils**, **@simpill/http.utils**, **@simpill/logger.utils** for behavior.
- **Additional protocols** — Only HTTP methods, correlation headers, env boolean parsing, and log env keys; extend or use other packages for more.

## Migration

Other @simpill packages (api.utils, http.utils, middleware.utils, env.utils, logger.utils) should import these types and constants from here instead of defining their own. See [docs/adr/0001-utils-protocols-and-canonical-ownership.md](../../docs/adr/0001-utils-protocols-and-canonical-ownership.md).
