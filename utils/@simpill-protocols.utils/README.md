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

- **HTTP methods**: `HTTP_METHOD`, `HttpMethod` — GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS, QUERY (RFC 10008)
- **HTTP method registry**: `HTTP_METHOD_PROPERTIES`, `AnyHttpMethod` — IANA `safe`/`idempotent` columns for all ten registered methods (RFC 9110, RFC 5789, RFC 10008)
- **Retry/cache primitives**: `SAFE_HTTP_METHODS`, `IDEMPOTENT_HTTP_METHODS` (+ `SafeHttpMethod`, `IdempotentHttpMethod`) — the canonical inputs for HTTP client retry policies
- **Correlation**: `CORRELATION_HEADERS` — `x-request-id`, `x-trace-id`; `CORRELATION_ID_PATTERN` — canonical id shape `[A-Za-z0-9._~-]{1,128}` (do not reflect non-matching incoming ids)
- **W3C Trace Context**: `TRACE_CONTEXT_HEADERS` (`traceparent`, `tracestate`), `TRACE_CONTEXT_VERSION`, `TRACEPARENT_PATTERN` (strict version-00 shape, all-zero ids rejected). Kept separate from `CORRELATION_HEADERS` so the `CorrelationHeaderName` union stays stable for consumers keying `Record`s off it.
- **Env boolean**: `ENV_BOOLEAN_PARSING` — strict truthy `["true","1"]`, falsy `["false","0"]`; `ENV_BOOLEAN_PARSING_EXTENDED` — yn-convention sets (`yes/no`, `y/n`, `on/off`) for query strings and CLI flags
- **Log env**: `LOG_ENV_KEYS`, `LOG_FORMAT_VALUES` — keys and values for logger configuration

All exported constants are `Object.freeze`d: a stray runtime assignment can no longer silently corrupt the fleet-wide source of truth (TypeScript's `as const` only protects at compile time).

## Subpath exports

- `@simpill/protocols.utils` — all
- `@simpill/protocols.utils/shared` — same (package is shared-only)
- `@simpill/protocols.utils/client` — re-exports shared
- `@simpill/protocols.utils/server` — re-exports shared

### What we don't provide

- **Runtime behavior** — Constants, types, and validation patterns only; no env parsing, no HTTP client, no logger implementation. Use **@simpill/env.utils**, **@simpill/http.utils**, **@simpill/logger.utils** for behavior.
- **Additional protocols** — Only HTTP methods (and their IANA registry properties), correlation / W3C Trace Context header names and patterns, env boolean parsing policies, and log env keys; extend or use other packages for more.

## Migration

Other @simpill packages (api.utils, http.utils, middleware.utils, env.utils, logger.utils) should import these types and constants from here instead of defining their own. See [docs/adr/0001-utils-protocols-and-canonical-ownership.md](../../docs/adr/0001-utils-protocols-and-canonical-ownership.md).
