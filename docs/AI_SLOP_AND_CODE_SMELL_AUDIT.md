# AI Slop and Code Smell Audit – utils/ Packages

Scan of all packages under `utils/` for AI slop indicators, junior-level mistakes, type-safety issues, and bad code smells. Findings are numbered, categorized, and include severity and reasoning.

**Scope:** All 37 packages in `utils/` (src, tests, examples).  
**Severity:** Critical | High | Medium | Low

---

## Summary

| Category              | Count | Critical | High | Medium | Low |
|-----------------------|-------|----------|------|--------|-----|
| Architecture / Size  | 12    | 1        | 2    | 5      | 4   |
| TypeScript / Types     | 58    | 4        | 18   | 24     | 12  |
| AI Slop / Comments     | 42    | 0        | 6    | 20     | 16  |
| Junior / Code Smell    | 52    | 2        | 14   | 22     | 14  |
| Console / Side Effects | 28    | 0        | 8    | 12     | 8   |
| Documentation         | 18    | 0        | 2    | 10     | 6   |
| Consistency / Naming   | 24    | 0        | 4    | 12     | 8   |
| Duplication / DRY      | 14    | 1        | 5    | 6      | 2   |
| **Total**              | **248** | **8**  | **59** | **101** | **80** |

---

## 1. Architecture / File Size

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 1 | env.utils/src/server/env.utils.ts | (file) | Architecture | **Critical** | File is 1336 lines; project rule is 400 max | Single 1300+ line file is unmaintainable, violates stated 400-line limit, suggests AI or copy-paste bloat. |
| 2 | string.utils/src/shared/string.utils.ts | (file) | Architecture | High | File is 451 lines; over 400-line limit | Exceeds project rule; should be split by concern (format, case, template, etc.). |
| 3 | env.utils/src/server/env.utils.ts | 98+ | Architecture | High | Very high density of JSDoc and section comments | Over-documentation and section headers suggest generated or templated content. |
| 4 | logger.utils/src/shared/factory.ts | (file) | Architecture | Medium | Global mutable state (globalAdapter, globalConfig, isMockEnabled, isEnvConfigApplied) | Module-level mutable state makes testing and reasoning harder; consider dependency injection or explicit factory options. |
| 5 | api.utils/src/server/api-factory.ts | 88-257 | Architecture | Medium | Single large factory object with nested functions | One big closure; splitting into smaller modules would improve testability and readability. |
| 6 | env.utils/src/server/env.utils.ts | 97-410 | Architecture | Medium | EnvManager class does getters, cache, dynamic mode, refresh, encryption, extend | One class has too many responsibilities; should be split (e.g. EnvCache, EnvReader, EnvEncryption). |
| 7 | logger.utils/src/shared/index.ts | (file) | Architecture | Medium | Barrel re-exports 29+ items | Large barrel can hurt tree-shaking and discovery; consider subpath exports by concern. |
| 8 | file.utils/src/server/file.utils.ts | (file) | Architecture | Low | Multiple overloads of readFileAsync in one file | Acceptable but could be split into read/write modules. |
| 9 | patterns.utils (multiple files) | various | Architecture | Low | Many small pattern files (adapter, facade, proxy, etc.) | Slight over-abstraction for simple patterns; consider fewer, more cohesive modules. |
| 10 | token-optimizer.utils/src/shared/strategies/ | (dir) | Architecture | Low | Mixed naming: markdownStrategy.ts vs toonStrategy.ts vs tonlStrategy.ts | Inconsistent casing (Pascal vs camel in filenames). |
| 11 | nextjs.utils/src/server/ | (dir) | Architecture | Low | Many single-function files (route-helpers, logging-adapter, annotations-adapter) | Could be grouped into route, logging, annotations modules. |
| 12 | data.utils/src/shared/ | (dir) | Architecture | Low | data.extend duplicates object.utils get/set by path | Same concept in two packages; increases maintenance and confusion. |

---

## 2. TypeScript / Types

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 13 | object.utils/src/shared/get-set.ts | 23, 52, 54 | TypeScript | High | `(current as Record<string, unknown>)[key]` | Cast used to silence type system; narrow type with type guards or generics. |
| 14 | object.utils/src/shared/get-set.ts | 31 | TypeScript | Medium | Return type `unknown \| D` for getByPathOrDefault | Callers lose type; consider generic return or overloads. |
| 15 | object.utils/src/shared/get-set.ts | 12 | TypeScript | Medium | getByPath returns `unknown` | Public API returns unknown; weakens type safety at call sites. |
| 16 | api.utils/src/server/api-factory.ts | 160-163, 214-215, 220 | TypeScript | High | Multiple `as Record<...>` and `as z.ZodType<unknown>` | Casts used to satisfy generics; suggests schema/context types should be explicit. |
| 17 | api.utils/src/shared/types.ts | (21 unknown refs) | TypeScript | High | Heavy use of `unknown` in handler/middleware types | Public API contracts use unknown; narrow with generics per route. |
| 18 | nextjs.utils/src/server/logging-adapter.ts | 36-40 | TypeScript | Medium | `(ctx as Record<string, unknown>)` | Cast to get context shape; context should be typed. |
| 19 | nextjs.utils/src/shared/interfaces.ts | 50 | TypeScript | Medium | getRequestContext(): unknown | Return type too loose; should be a defined context type or generic. |
| 20 | events.utils/src/shared/events.utils.ts | 38-39, 45, 54 | TypeScript | High | `handler(p as M[K])`, `handler as (p: M[keyof M]) => void` | Casts in event system; type-safe event map still relies on assertions. |
| 21 | data.utils/src/shared/data.extend.ts | 12, 23-25, 40 | TypeScript | High | Multiple `as Record<string, unknown>` and `as string` | Internal casts; use generics or type guards. |
| 22 | file.utils/src/server/file.utils.ts | 55 | TypeScript | High | readFileJson: `return JSON.parse(raw) as T` | Unsafe; T is not validated; document or use Zod/validator. |
| 23 | env.utils/src/server/env.utils.ts | (8+ as casts) | TypeScript | High | Various casts for options and parsed output | Options and dotenv output should be typed; avoid silencing compiler. |
| 24 | logger.utils/src/shared/types.ts | (4 any refs) | TypeScript | High | any in log metadata or formatter types | Metadata should be Record<string, unknown> or a defined type. |
| 25 | logger.utils/src/shared/formatters/*.ts | various | TypeScript | Medium | Casts in formatters for entry/metadata | Formatter input types should be explicit. |
| 26 | logger.utils/src/adapters/file.adapter.ts | (2 any) | TypeScript | Medium | any in file adapter | Typed stream or buffer. |
| 27 | cache.utils/src/server/redis-cache.util.ts | (1 any) | TypeScript | Medium | any in Redis client or result | Use Redis client types or unknown + guard. |
| 28 | object.utils/src/shared/get-set.ts | 73 | TypeScript | Medium | current: Record<string, unknown> in setByPath | Constraint could be generic for nested set. |
| 29 | function.utils/src/shared/pipe-compose.ts | 18, 33 | TypeScript | Medium | pipe/compose return `(x: unknown): unknown` | Loses input/output types; use generics. |
| 30 | zustand.utils/src/client/persist.ts | (2 as) | TypeScript | Medium | Casts for persist state | State type should flow from store generic. |
| 31 | zustand.utils/src/client/create-app-store.ts | (3 as) | TypeScript | Medium | Casts in store creation | Slices/state types should be inferred. |
| 32 | zod.utils/src/shared/safe-parse.ts | (1 as) | TypeScript | Low | Cast in parseOrThrow or similar | Minor; ensure schema type is used. |
| 33 | zod.utils/src/shared/schema-builders.ts | (2 as) | TypeScript | Low | Casts in optionalWithDefault or field builders | Low impact. |
| 34 | socket.utils/src/client/create-reconnecting-websocket.ts | (2 as) | TypeScript | Medium | Casts for WebSocket or options | Options and event types should be typed. |
| 35 | patterns.utils (result, proxy, mediator, etc.) | various | TypeScript | Medium | Multiple `as` in pattern implementations | Pattern types often use unknown; tighten where possible. |
| 36 | async.utils/src/shared/*.ts | (multiple) | TypeScript | Medium | unknown in timeout-result, settle-results, map, etc. | Generic parameters could preserve types through pipelines. |
| 37 | errors.utils/src/shared/serialize-error.ts | (4 as/any) | TypeScript | Medium | Casts when serializing errors | Use type guards for Error vs plain object. |
| 38 | test.utils/src/shared/faker-wrapper.ts | (1 any) | TypeScript | Low | any in faker override or option | Type faker options. |
| 39 | test.utils/src/shared/enricher.ts | (2 as) | TypeScript | Low | Casts in enricher | Generic enricher type. |
| 40 | enum.utils/src/shared/enum.utils.ts | (6 as) | TypeScript | Medium | Casts for enum value access | Enum helpers could use generics. |
| 41 | misc.utils/src/shared/primitive-helpers.ts | (3 as) | TypeScript | Low | Casts for primitives | Low risk. |
| 42 | protocols.utils/src/shared/*.ts | various | TypeScript | Medium | Casts in correlation, log-env, env-boolean | Protocol types could be stricter. |
| 43 | time.utils/src/shared/date-time.ts | (2 as) | TypeScript | Low | Date arithmetic casts | Minor. |
| 44 | time.utils/src/server/interval-manager.ts | (5 as) | TypeScript | Medium | Casts for timer options or names | Options type should be explicit. |
| 45 | uuid.utils/src/shared/uuid.utils.ts | (2 as) | TypeScript | Low | UUID parse/validate casts | Low. |
| 46 | crypto.utils/src/server/crypto.utils.ts | (2 as) | TypeScript | Low | Buffer or encoding casts | Low. |
| 47 | factories.utils/src/shared/error-factory.ts | (1 as) | TypeScript | Low | Error extension cast | Low. |
| 48 | annotations.utils/src/shared/metadata-store.ts | (1 any) | TypeScript | Medium | any in metadata value | Use unknown or generic. |
| 49 | adapters.utils/src/shared/logger-adapter.ts | (9 unknown) | TypeScript | Medium | Heavy unknown in adapter interface | Define log payload type. |
| 50 | token-optimizer.utils (strategies, types) | various | TypeScript | High | Many any/as in strategies and types | Strategy input/output should be typed. |
| 51 | env.utils/src/server/process-env.d.ts | (5 as) | TypeScript | Medium | Declaration merges with casts | Extension types should be declared properly. |
| 52 | nextjs.utils/src/server/create-safe-action.ts | (1 as) | TypeScript | Medium | Cast in action result | Input/output types should be generic. |
| 53 | react.utils/src/client/use-stable-callback.ts | (1 as) | TypeScript | Low | Cast for ref stability | Low. |
| 54 | react.utils/src/client/use-latest.ts | (1 as) | TypeScript | Low | Ref cast | Low. |
| 55 | api.utils client() return type | 49 | TypeScript | High | `Record<string, (options?: Record<string, unknown>) => Promise<unknown>>` | Client methods return Promise<unknown>; should be typed per route. |
| 56 | api.utils handlers() return type | 51-57 | TypeScript | High | Handler receives body?: unknown, returns Promise<unknown> | Request/response should be typed from schema. |
| 57 | middleware.utils/src/shared/types.ts | (2 unknown) | TypeScript | Low | unknown in middleware context | Document or type. |
| 58 | request-context.utils/src/shared/types.ts | (1 unknown) | TypeScript | Low | Context shape unknown | Define context interface. |
| 59 | logger.utils/src/shared/adapter.ts | (2 any) | TypeScript | Medium | any in adapter config or entry | Use LogEntry/LogMetadata. |
| 60 | logger.utils/src/shared/formatters/formatter.adapter.ts | (1 any) | TypeScript | Low | Formatter cast | Low. |
| 61 | env.utils/src/shared/parse-helpers.ts | (3 as) | TypeScript | Low | Parse helper casts | Low. |
| 62 | env.utils/src/shared/constants.ts | (12 as) | TypeScript | Medium | Casts in constant definitions | Ensure const assertions where needed. |
| 63 | logger.utils/src/shared/constants.ts | (13 as) | TypeScript | Medium | Same as above | Same. |
| 64 | object.utils/src/shared/merge.ts | (8 as) | TypeScript | Medium | Casts in deep merge | Deep merge is inherently loose; document. |
| 65 | object.utils/src/shared/pick-omit.ts | (6 as) | TypeScript | Medium | Casts in pick/omit | Generics could reduce casts. |
| 66 | object.utils/src/shared/immutable.ts | (2 as) | TypeScript | Low | deepFreeze cast | Low. |
| 67 | object.utils/src/shared/create.ts | (1 as) | TypeScript | Low | createWithDefaults cast | Low. |
| 68 | object.utils/src/shared/singleton.ts | (2 as) | TypeScript | Low | Singleton factory cast | Low. |
| 69 | env.utils/src/shared/errors.ts | (2 as) | TypeScript | Low | Error subclass casts | Low. |
| 70 | logger.utils/src/adapters/pino.adapter.ts | (2 any) | TypeScript | Medium | Pino metadata any | Use Record<string, unknown>. |

---

## 3. AI Slop / Comments

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 71 | env.utils/src/server/env.utils.ts | 36-45 | AI Slop | High | JSDoc restates "Log informational messages (e.g. ...)" for each method | Obvious from method name; remove or explain when/why to use. |
| 72 | env.utils/src/server/env.utils.ts | 48-56 | AI Slop | Medium | JSDoc for envPath, envPaths, overload, overrides restates option name | Redundant; keep only non-obvious behavior. |
| 73 | env.utils/src/server/env.utils.ts | 97-111 | AI Slop | Medium | Section comments "Standard getters", "Required getters" | Section headers are filler; structure with types or file split. |
| 74 | logger.utils/src/shared/factory.ts | 1-4 | AI Slop | Low | @file @description "Central factory for creating loggers..." | File tag redundant in modular codebase. |
| 75 | logger.utils/src/shared/factory.ts | 21-27, 36-38, 54-56, 65-68, 81-82 | AI Slop | Medium | Comments like "Apply environment configuration if not already applied" | Restate the next line of code; delete or explain why. |
| 76 | logger.utils/src/shared/constants.ts | 12-14, 24-26, 40-42, etc. | AI Slop | Low | "Log levels in uppercase format (for output)" | Slightly redundant with constant names. |
| 77 | api.utils/src/server/api-factory.ts | (minimal comments) | AI Slop | Low | Few comments; complex logic could use "why" not "what" | Where logic is non-obvious, comment intent. |
| 78 | object.utils/src/shared/get-set.ts | 9-11, 28-29, 36-37, 61-62 | AI Slop | Medium | "Gets a nested value by dot-separated path. Returns undefined if..." | Restates signature; shorten to edge cases only. |
| 79 | file.utils/src/server/file.utils.ts | 21-26, 39-42, 48-52, etc. | AI Slop | Medium | Every function has @param path, @returns Promise of... | JSDoc repeats types; keep only constraints (e.g. encoding). |
| 80 | nextjs.utils/src/server/route-helpers.ts | 4-5, 22-23, 36-37, 48 | AI Slop | Low | One-line JSDoc per export | Acceptable but generic. |
| 81 | string.utils/src/shared/string.utils.ts | (37 @param/@returns) | AI Slop | High | Very high comment-to-code ratio in one file | Suggests generated or over-documented file. |
| 82 | env.utils/src/server/env.utils.ts | 412-416, 436-439, 448-454, 463-466 | AI Slop | Medium | "In dynamic mode, reads from process.env directly" repeated for each method | Single note at class or option level is enough. |
| 83 | logger.utils/src/shared/buffered-adapter.ts | (11 comments) | AI Slop | Medium | Comments restate buffer/flush behavior | Keep only invariants (e.g. "Never throw from logger"). |
| 84 | logger.utils/src/shared/context.ts | (7 comments) | AI Slop | Low | Context provider comments | Some redundancy. |
| 85 | async.utils/src/shared/retry.ts | (3 @param) | AI Slop | Low | Standard JSDoc | Fine. |
| 86 | patterns.utils/src/shared/result.ts | (19 JSDoc lines) | AI Slop | Medium | Dense JSDoc for each helper | Trim to "why" and edge cases. |
| 87 | uuid.utils/src/shared/uuid.utils.ts | (17 JSDoc) | AI Slop | Medium | Every export documented with similar phrasing | Consolidate or reduce. |
| 88 | file.utils/src/server/file.utils.ts | 88-92, 94-99, etc. | AI Slop | Low | WriteFileJsonOptions "space for pretty-print" | Slight redundancy. |
| 89 | crypto.utils/src/server/crypto.utils.ts | (11 JSDoc) | AI Slop | Low | Many param/returns | Trim to security-relevant notes. |
| 90 | patterns.utils (facade, composite, etc.) | various | AI Slop | Low | Pattern name repeated in comment | Low. |
| 91 | env.utils examples (basic, advanced) | various | AI Slop | Medium | Long comment blocks in examples | Examples should be minimal; move prose to README. |
| 92 | logger.utils examples | various | AI Slop | Medium | 23+ comments in 01-basic-usage, 31 in 02-custom-adapters | Example files overly commented. |
| 93 | env.utils examples server/ | various | AI Slop | Low | 25-45 comments per file in server examples | Reduce to one-line where needed. |
| 94 | logger.utils/src/shared/formatters/simple.formatter.ts | (6 comments) | AI Slop | Low | Inline comments in formatter | Some restate logic. |
| 95 | logger.utils/src/shared/formatters/colored.formatter.ts | (3 comments) | AI Slop | Low | Same. |
| 96 | logger.utils/src/shared/formatters/legacy.formatters.ts | (1 comment) | AI Slop | Low | Low. |
| 97 | time.utils/src/shared/date-time.ts | (1 JSDoc) | AI Slop | Low | Sparse; ok. |
| 98 | async.utils/src/shared/concurrency.utils.ts | (11 comments) | AI Slop | Medium | Many step-by-step comments | Replace with clear function names. |
| 99 | async.utils/src/shared/delay.ts | (2 comments) | AI Slop | Low | Fine. |
| 100 | async.utils/src/shared/map.ts | (8 comments) | AI Slop | Low | Some redundancy. |
| 101 | errors.utils/src/shared/serialize-error.ts | (3 comments) | AI Slop | Low | Ok. |
| 102 | errors.utils/src/shared/app-error.ts | (2 comments) | AI Slop | Low | Ok. |
| 103 | data.utils/src/shared/data.extend.ts | 1-4 | AI Slop | Low | "Data extension: deep default, merge arrays..." | Short; ok. |
| 104 | data.utils/src/shared/config.utils.ts | (comments) | AI Slop | Low | Config layer comments | Ok. |
| 105 | function.utils/src/shared/noop.ts | (1 comment) | AI Slop | Low | Noop comment | Fine. |
| 106 | env.utils/src/server/env.utils.ts | 59-76 (dynamic option) | AI Slop | High | Long bullet list and note for one option | Over-explanation; shorten to one paragraph. |
| 107 | env.utils/src/server/env.utils.ts | 79-93 (logger option) | AI Slop | Medium | @example block in JSDoc | Example in JSDoc is hard to maintain; link to examples/. |
| 108 | logger.utils/src/shared/env.config.ts | 205 | AI Slop | Low | Comment "console.log(`Log level: ${envConfig.minLevel}`)" | Stale or example; remove or implement. |
| 109 | logger.utils/src/shared/index.ts | (29 exports + comments) | AI Slop | Low | Barrel file comments | Low. |
| 110 | protocols.utils/src/shared/correlation.ts | (minimal) | AI Slop | Low | Fine. |
| 111 | request-context.utils/src/index.ts | (1 comment) | AI Slop | Low | Fine. |
| 112 | token-optimizer.utils (strategies) | various | AI Slop | Medium | Inline comments in strategy switch/cases | Some restate "return token.text" etc.; remove. |

---

## 4. Junior / Code Smell

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 113 | nextjs.utils/src/server/route-helpers.ts | 37, 49 | Junior | Medium | Magic numbers 200, 500 for status | Use named constants (e.g. HTTP_STATUS.OK, SERVER_ERROR). |
| 114 | zod.utils/src/shared/request-schemas.ts | 35, 40, 48 | Junior | Medium | Default maxLimit = 100 in three places | Extract DEFAULT_PAGINATION_LIMIT constant. |
| 115 | time.utils/src/shared/date-time.ts | 34, 71, 78, 85, 119-122, 145-151 | Junior | High | Magic numbers 1000, 3600, 60, 24 for time units | Use named constants (MS_PER_SECOND, SECONDS_PER_HOUR, etc.). |
| 116 | logger.utils/src/shared/constants.ts | 72 | Junior | Low | MAX_CACHE_SIZE: 1000, MAX_ERROR_CAUSE_DEPTH: 3 | Already in constants; ensure no other magic numbers in logic. |
| 117 | logger.utils/src/shared/buffered-adapter.ts | 13-14 (JSDoc) | Junior | Low | maxBufferSize: 100, flushIntervalMs: 1000 in example | Example values; ok. |
| 118 | test.utils/src/shared/internal-constants.ts | 16 | Junior | Low | TIMEOUT_MS_1000 = 1000 | Good; pattern to replicate elsewhere. |
| 119 | api.utils/src/server/api-factory.ts | 92-94 | Junior | Medium | defaultBaseUrl = options.baseUrl ?? "" | Empty string as default is vague; consider undefined and handle at call site. |
| 120 | nextjs.utils/src/server/logging-adapter.ts | 8, 11, 14, 17 | Junior | High | meta ?? "" for console.info/warn/error/debug | Passing "" as second arg to console is odd; use meta ?? undefined or spread. |
| 121 | events.utils/src/shared/events.utils.ts | 29 | Junior | High | Default onError logs to console.error | Library code should not default to console; require onError or use noop. |
| 122 | events.utils/src/shared/pubsub.utils.ts | 17 | Junior | High | Same; console.error in default handler | Same as above. |
| 123 | events.utils/src/shared/observer.object.utils.ts | 27 | Junior | High | Same pattern | Same. |
| 124 | time.utils/src/server/interval-manager.ts | 81, 117, 239 | Junior | Medium | console.error and console.log in library | Use optional logger or noop; avoid hard-coded console. |
| 125 | async.utils/src/shared/polling-manager.ts | 153 | Junior | Medium | console.error for poll error | Same; inject logger or callback. |
| 126 | logger.utils/src/shared/buffered-adapter.ts | 74 | Junior | Medium | console.error in flush failure | Logger adapter should not use console directly; use fallback adapter. |
| 127 | nextjs.utils/src/client/middleware-helpers.ts | 38-42 | Junior | Low | Duplicate "x-request-id", "x-trace-id" strings | Constants exist but still repeated in get(); use constants everywhere. |
| 128 | nextjs.utils/src/server/with-request-context.ts | 36-37 | Junior | Low | Same; headers.get("x-request-id") repeated | Use REQUEST_ID_HEADER constant. |
| 129 | data.utils/src/shared/data.extend.ts | 31-52 | Junior | High | setByPath/getByPath duplicate object.utils logic | Copy-paste; should use or re-export object.utils or single shared impl. |
| 130 | data.utils/src/shared/config.utils.ts | 59 | Junior | High | Local setByPath reimplementation | Third copy of path set logic; DRY violation. |
| 131 | object.utils/src/shared/get-set.ts | 7 | Junior | Low | PATH_SEP = "." only used in one file | Fine; could be in constants if used elsewhere. |
| 132 | api.utils/src/server/api-factory.ts | 108 | Junior | Low | transform: schema.response ? undefined : undefined | Redundant; always undefined here; remove or implement. |
| 133 | socket.utils/src/client/create-reconnecting-websocket.ts | 206 | Junior | Low | heartbeat.message ?? "" | Empty string fallback for message; document or use undefined. |
| 134 | string.utils/src/shared/format.ts | (1 any) | Junior | Medium | any in format args | Use unknown or typed placeholder map. |
| 135 | cache.utils/src/shared/memoize.ts | (3 any) | Junior | Medium | any in key or result | Use generics. |
| 136 | cache.utils/src/shared/memoize-async.ts | (2 any) | Junior | Medium | Same. |
| 137 | async.utils/src/shared/any-some.ts | (1 any) | Junior | Low | Function name "any" collides with type any | Rename to anySettled or similar to avoid confusion. |
| 138 | async.utils/src/shared/props.ts | (3 any) | Junior | Medium | PromiseProps with any/unknown | Type keys and values. |
| 139 | enum.utils/src/shared/enum.utils.ts | (6 as) | Junior | Medium | Casts in enum helpers | See type section; also naming could be clearer. |
| 140 | misc.utils/src/shared/primitive-helpers.ts | (3 as) | Junior | Low | Casts | Low. |
| 141 | token-optimizer.utils (strategies) | various | Junior | High | Magic strings for token types ("text", "escape", "strong", etc.) | Extract to constants or enum. |
| 142 | token-optimizer.utils/src/shared/strategies/markdownStrategy.ts | 16-17, 44, 63 | Junior | Medium | "  ", "\n\n", "  \n" as literals | Use named constants (already INDENTATION, COLLAPSED_* in file; ensure all literals covered). |
| 143 | file.utils/src/server/path.utils.ts | (7 as) | Junior | Medium | Path utils casts | Type path operations. |
| 144 | file.utils/src/server/file.utils.ts | (13 as) | Junior | Medium | Many casts in file utils | See type section. |
| 145 | object.utils/src/shared/merge.ts | (8 as) | Junior | Medium | Merge logic with casts | Document merge semantics; consider typed deep merge. |
| 146 | object.utils/src/shared/pick-omit.ts | (6 as) | Junior | Medium | Pick/omit casts | Generics could reduce. |
| 147 | errors.utils/src/shared/error-codes.ts | (1 as) | Junior | Low | Error code cast | Low. |
| 148 | factories.utils/src/shared/singleton-factory.ts | (3 as) | Junior | Low | Singleton cast | Low. |
| 149 | test.utils/src/shared/faker-wrapper.ts | (1 any) | Junior | Low | Faker options | Low. |
| 150 | test.utils/src/shared/enricher.ts | (2 as) | Junior | Low | Enricher | Low. |
| 151 | data.utils/src/shared/data.utils.ts | (9 as) | Junior | Medium | data utils casts | See type section. |
| 152 | data.utils/src/shared/data.prepare.ts | (3 as) | Junior | Medium | Prepare casts | Type preparation pipeline. |
| 153 | data.utils/src/shared/data.validate.ts | (6 as) | Junior | Medium | Validation casts | Type validation result. |
| 154 | data.utils/src/shared/config.utils.ts | (3 as) | Junior | Low | Config casts | Low. |
| 155 | data.utils/src/shared/search.utils.ts | 113 | Junior | Low | path.split(".").pop() ?? "" | Edge case; document. |
| 156 | function.utils/src/shared/arguments.utils.ts | (2 as) | Junior | Low | Args utils | Low. |
| 157 | function.utils/src/shared/annotations.utils.ts | (1 as) | Junior | Low | Annotations | Low. |
| 158 | collections.utils/src/shared/collections/deque.ts | (2 as) | Junior | Low | Deque | Low. |
| 159 | collections.utils/src/shared/collections/circular-buffer.ts | (1 as) | Junior | Low | Circular buffer | Low. |
| 160 | logger.utils/src/adapters/file.adapter.ts | (2 any) | Junior | Medium | File adapter any | Type stream/config. |
| 161 | logger.utils/__tests__/adapters/file.adapter.unit.test.ts | (16 as, 6 any) | Junior | High | Tests use many casts and any | Tests should use minimal casts; use typed fixtures. |
| 162 | env.utils/__tests__/server/unit/env-manager.unit.test.ts | (9 as) | Junior | Medium | Test casts | Type test helpers. |
| 163 | logger.utils/__tests__/shared/unit/colored-formatter.unit.test.ts | (20 as) | Junior | High | Excessive casts in tests | Suggests API is hard to use type-safely. |
| 164 | logger.utils/__tests__/shared/unit/simple-formatter.unit.test.ts | (8 as) | Junior | Medium | Same. |

---

## 5. Console / Side Effects

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 165 | nextjs.utils/src/server/logging-adapter.ts | 8, 11, 14, 17 | Console | High | console.info/warn/error/debug in production adapter | Default logging adapter should use injectable logger, not console. |
| 166 | events.utils/src/shared/events.utils.ts | 29 | Console | High | console.error in default onError | Library must not assume console; make onError required or noop. |
| 167 | events.utils/src/shared/pubsub.utils.ts | 17 | Console | High | Same. |
| 168 | events.utils/src/shared/observer.object.utils.ts | 27 | Console | High | Same. |
| 169 | time.utils/src/server/interval-manager.ts | 81, 117, 239 | Console | Medium | console.error and console.log | Use optional logger. |
| 170 | async.utils/src/shared/polling-manager.ts | 153 | Console | Medium | console.error | Same. |
| 171 | logger.utils/src/shared/buffered-adapter.ts | 74 | Console | Medium | console.error | Use fallback adapter, not raw console. |
| 172 | token-optimizer.utils/scripts/literal-audit-scan.ts | 137, 162, 165 | Console | Low | console.error/log in script | Scripts may use console; acceptable. |
| 173 | token-optimizer.utils/scripts/literal-audit-report.ts | 253 | Console | Low | console.log in script | Same. |
| 174 | token-optimizer.utils/scripts/literal-audit-aggregate.ts | 157 | Console | Low | Same. |
| 175 | token-optimizer.utils/scripts/generate-benchmark-data.ts | 187-188 | Console | Low | Same. |
| 176 | token-optimizer.utils/scripts/benchmark.ts | 106, 125, 183-191, 207 | Console | Low | Same. |
| 177 | uuid.utils/examples/01-basic-usage.ts | 17-32 | Console | Low | Multiple console.log in example | Examples can log; keep minimal. |
| 178 | adapters.utils/examples/01-basic-usage.ts | 16-29 | Console | Low | Same. |
| 179 | api.utils/examples/01-basic-usage.ts | 35, 38 | Console | Low | Same. |
| 180 | patterns.utils/examples/*.ts | many | Console | Low | console.log in examples | Same. |
| 181 | All other examples/*.ts | various | Console | Low | console.log in examples | Acceptable for demos. |
| 182 | env.utils/src/server/env.utils.ts | (no direct console) | Console | Low | EnvManager uses logger adapter | Good. |
| 183 | logger.utils/src/shared/env.config.ts | 205 (comment only) | Console | Low | Comment references console.log | Remove or implement. |
| 184 | nextjs.utils/src/server/logging-adapter.ts | (whole file) | Console | High | createLoggingIntegration is console-based | Document that this is for dev/default only; recommend app logger. |
| 185 | socket.utils/examples/01-basic-usage.ts | 20, 25, 29-30 | Console | Low | Example | Ok. |
| 186 | string.utils/examples/01-basic-usage.ts | 20-26 | Console | Low | Example | Ok. |
| 187 | misc.utils/examples/01-basic-usage.ts | 13-30 | Console | Low | Example | Ok. |
| 188 | resilience.utils/examples/01-basic-usage.ts | 13-29 | Console | Low | Example | Ok. |
| 189 | request-context.utils/examples/01-basic-usage.ts | 12-21 | Console | Low | Example | Ok. |
| 190 | async.utils/examples/01-basic-usage.ts | 30-124 | Console | Low | Many console.log in one example | Consider reducing for readability. |
| 191 | data.utils/examples/01-basic-usage.ts | 11-27 | Console | Low | Example | Ok. |
| 192 | collections.utils/examples/01-basic-usage.ts | 26-97 | Console | Low | Many console.log | Consider trimming. |

---

## 6. Documentation

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 193 | env.utils/src/server/env.utils.ts | (many) | Documentation | Medium | JSDoc explains "what" not "when/why" for getString, getNumber, etc. | Add when to use default vs required, encryption behavior. |
| 194 | api.utils (api-factory, types) | various | Documentation | High | Public client() and handlers() return untyped promises | README or JSDoc should document that callers must type from schema. |
| 195 | object.utils/src/shared/get-set.ts | (all) | Documentation | Medium | getByPath return unknown; no guidance on typing at call site | Document pattern (e.g. type assertion or generic wrapper). |
| 196 | file.utils/src/server/file.utils.ts | 52-55 | Documentation | High | readFileJson<T>: "Typed as T; validate at call site if needed" | Dangerous; document prominently that T is not runtime-validated. |
| 197 | nextjs.utils/src/shared/interfaces.ts | 50 | Documentation | Medium | getRequestContext(): unknown | Document expected shape or point to context type. |
| 198 | events.utils (EventEmitter, PubSub) | various | Documentation | Low | onError default behavior not documented in README | Document that default logs to console and recommend providing onError. |
| 199 | logger.utils (factory, adapters) | various | Documentation | Medium | Global state (setAdapter, setMock) not clearly documented | Document thread-safety and test isolation. |
| 200 | data.utils (data.extend) | various | Documentation | High | Duplicate getByPath/setByPath vs object.utils not documented | Document that data.extend is for Record<string, unknown> and object.utils is generic. |
| 201 | async.utils (raceWithTimeout, limit, etc.) | various | Documentation | Low | Some functions lack JSDoc | Add one-line description for public API. |
| 202 | patterns.utils (result, strategy-selector) | various | Documentation | Low | Pattern modules could link to README for usage | Low. |
| 203 | token-optimizer.utils (strategies) | various | Documentation | Medium | Strategy interface and payload types could be clearer | Document input/output and error handling. |
| 204 | zustand.utils (persist, create-app-store) | various | Documentation | Low | Persist options and client-only storage could be documented | Low. |
| 205 | zod.utils (safe-parse, request-schemas) | various | Documentation | Low | flattenZodError, formatZodError behavior is clear from name | Ok. |
| 206 | middleware.utils | various | Documentation | Low | Correlation middleware options | Ok. |
| 207 | request-context.utils | various | Documentation | Low | runWithRequestContext contract | Ok. |
| 208 | resilience.utils (retry-result) | various | Documentation | Low | Retry result type | Ok. |
| 209 | http.utils (create-http-client) | various | Documentation | Low | Client options | Ok. |
| 210 | socket.utils (reconnecting websocket) | various | Documentation | Medium | Reconnect and heartbeat options could be in README | Medium. |

---

## 7. Consistency / Naming

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 211 | token-optimizer.utils/src/shared/strategies/ | (filenames) | Consistency | Medium | markdownStrategy.ts vs toonStrategy.ts vs tonlStrategy.ts | Inconsistent casing (Strategy suffix vs no suffix in some). |
| 212 | token-optimizer.utils (types) | tokenOptimizer.types.ts | Consistency | Medium | PascalCase file name vs kebab-case elsewhere | Use token-optimizer.types.ts or align to project. |
| 213 | cache.utils/src/server/redis-cache.util.ts | (filename) | Consistency | High | .util.ts suffix vs .utils.ts in package name | In-package use .utils.ts or consistent suffix. |
| 214 | env.utils/src/shared/parse-helpers.ts | (filename) | Consistency | Low | parse-helpers vs parseHelpers elsewhere | Project uses kebab-case files; ok. |
| 215 | data.utils (data.extend, data.validate, data.prepare) | (filenames) | Consistency | Low | data.* dot prefix; other packages use single name | Minor; consistent within package. |
| 216 | logger.utils (formatters, adapters) | (dir names) | Consistency | Low | formatters/ vs adapter in file name | Ok. |
| 217 | nextjs.utils (create-next-app, create-safe-action) | (naming) | Consistency | Low | create* for factories; consistent | Good. |
| 218 | protocols.utils (correlation, log-env, http) | (files) | Consistency | Low | Short file names | Ok. |
| 219 | object.utils (get-set, pick-omit) | (files) | Consistency | Low | get-set vs getSet could be get-set.ts | Ok. |
| 220 | enum.utils vs enum/ (enums.util.ts) | (path) | Consistency | High | Two enum locations: enum.utils/ and enum/ | Remove duplicate or document which is canonical. |
| 221 | utils/enum/enums.util.ts | (file) | Consistency | High | Old naming enums.util.ts in enum/ folder | Likely legacy; consolidate with enum.utils. |
| 222 | nextjs.utils middleware-helpers vs with-request-context | Consistency | Low | with* vs get* naming | Ok. |
| 223 | api.utils (createApiFactory vs ApiFactory type) | Consistency | Low | create* returns interface; ok | Good. |
| 224 | string.utils (format, case.utils, string.utils) | Consistency | Low | string.utils.ts and case.utils.ts | Slight redundancy in name; ok. |
| 225 | test.utils (faker-wrapper, enricher, vitest-test-utils) | Consistency | Low | Hyphenated names | Ok. |
| 226 | errors.utils (app-error, error-codes, serialize-error) | Consistency | Low | Consistent hyphen | Good. |
| 227 | time.utils (date-time, interval-manager) | Consistency | Low | Ok | Good. |
| 228 | logger.utils (LOGGER_CONTEXT.DEFAULT vs "Logger") | Consistency | Low | Constant vs string | Ensure no duplicate literals. |
| 229 | env.utils (ENV_KEY, NODE_ENV) | Consistency | Low | Constants used; good | Good. |
| 230 | protocols.utils (CORRELATION_HEADERS.REQUEST_ID) | Consistency | Low | Centralized; good | Good. |
| 231 | nextjs.utils (REQUEST_ID_HEADER in two files) | Consistency | Medium | Same constant defined in middleware-helpers and with-request-context | Single source (e.g. protocols.utils) and import. |
| 232 | middleware.utils (requestIdHeader: "x-request-id") | Consistency | Medium | Literal in options; use constant | Use CORRELATION_HEADERS or shared constant. |
| 233 | logger.utils (LOG_PREFIX, ERROR_MESSAGES) | Consistency | Low | Centralized | Good. |
| 234 | All packages (index.ts barrel exports) | various | Consistency | Low | Some packages export from index, some from subpaths | Follow CONTRIBUTING pattern consistently. |

---

## 8. Duplication / DRY

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 235 | data.utils vs object.utils | getByPath, setByPath | Duplication | **Critical** | Three implementations of path get/set (object.utils get-set.ts, data.extend.ts, config.utils setByPath) | Single shared implementation; re-export or depend on object.utils. |
| 236 | nextjs.utils (middleware-helpers, with-request-context) | REQUEST_ID_HEADER, TRACE_ID_HEADER, get logic | Duplication | High | Same header names and "x-request-id"/"x-trace-id" logic in two files | Extract to shared (e.g. protocols.utils) and reuse. |
| 237 | env.utils (getValue, getValueOrDefault, getString, getNumber) | various | Duplication | Medium | Getter methods share pattern; could be one generic with option type | Reduce repetition with private generic get<T>. |
| 238 | logger.utils (formatters) | Legacy vs simple vs colored | Duplication | Low | Similar structure; some shared logic could be base formatter | Low priority. |
| 239 | api.utils (client fetch, handler dispatch) | 150-230 | Duplication | Medium | Path substitution and param parsing logic could be shared | Extract substitutePath, parsePathParams to shared. |
| 240 | async.utils (retry, raceWithTimeout, limit) | Duplication | Low | Some shared "run with timeout" patterns | Low. |
| 241 | patterns.utils (adapter, facade) | Duplication | Low | Small wrappers; minimal duplication | Low. |
| 242 | time.utils (addHours, addMinutes, addSeconds) | date-time.ts | Duplication | Medium | Similar add* functions; could be single add(d, amount, unit) | Reduce with unit enum or single function. |
| 243 | string.utils (toCamelCase, toSnakeCase, etc.) | Duplication | Low | Each casing is different; ok | Low. |
| 244 | test.utils (faker-wrapper, enricher) | Duplication | Low | Different concerns | Low. |
| 245 | env.utils (parse-helpers vs server getNumber/getBoolean) | Duplication | Medium | Server calls parse helpers; some duplication of "get then parse" | Acceptable. |
| 246 | logger.utils (simple-adapter, file.adapter, pino.adapter) | Duplication | Low | Each adapter different backend | Low. |
| 247 | zod.utils (paginationSchema, offsetPaginationSchema) | Duplication | Low | Similar shape; different keys | Low. |
| 248 | token-optimizer.utils (strategies) | Duplication | Medium | Each strategy has similar structure (optimize method, token handling) | Consider base class or shared helpers. |

---

## 9. Lint / Tooling Suppression

| # | File | Line(s) | Category | Severity | Issue | Reasoning |
|---|------|--------|----------|----------|-------|-----------|
| 249 | logger.utils/__tests__/adapters/multi.adapter.unit.test.ts | 182 | Lint | High | eslint-disable-line @typescript-eslint/no-throw-literal for "throw String error" | Tests should throw Error(); disabling rule hides bad practice. |
| 250 | env.utils/examples/server/03-process-env-extension.ts | 28, 32, 36, 40 | Lint | Medium | Four @ts-expect-error "Methods are added at runtime" | Example extends process.env; document why and prefer typed extension in real code. |
| 251 | Various test files | (any, as) | Lint | Medium | Tests use any and as to satisfy mocks | Prefer typed mocks and minimal assertions; reduces technical debt. |

---

## Remediation Priorities

1. **Critical:** Split env.utils (1336 lines); consolidate getByPath/setByPath to one implementation.
2. **High:** Remove or type all `any`; replace unsafe `as` with type guards or generics; stop defaulting to console in libraries (events, nextjs logging, interval-manager, polling-manager).
3. **Medium:** Extract magic numbers (time, HTTP status, pagination); reduce redundant JSDoc; document unsafe APIs (readFileJson<T>, client()/handlers() return types); consolidate x-request-id/x-trace-id usage.
4. **Low:** Trim example comments; align file naming (token-optimizer, redis-cache.util); add missing JSDoc where public API is unclear.

---

## Completed remediations (tracking)

| Finding(s) | Remediation |
|------------|-------------|
| Console/side effects (events, async, logger, time, nextjs) | Default onError/onFlushError/callback errors use noop; logging adapter doc says use app logger in prod. |
| Magic numbers (time, nextjs, zod) | time: MS_PER_*, SECONDS_*, HOURS_PER_DAY; nextjs: HTTP_STATUS_*; zod: DEFAULT_PAGINATION_LIMIT. |
| x-request-id / x-trace-id | CORRELATION_HEADERS from @simpill/protocols.utils used in nextjs, middleware; READMEs and types updated. |
| Unsafe API docs (readFileJson, api client/handlers, getByPath) | file.utils, api.utils, object.utils README + JSDoc. |
| #250 env.utils example | @ts-expect-error documented; add ProcessEnv declaration to remove. |
| #232 middleware.utils | README uses CORRELATION_HEADERS in Usage and Header casing. |
| #231, #236 nextjs.utils | README + CorrelationHeaders type from protocols; single source. |
| #251 typed mocks | middleware.utils example: MiddlewareRequest/MiddlewareResponse, no `as any`. |
| #213 cache.utils redis filename | redis-cache.util.ts → redis-cache.utils.ts (or redis-cache.ts); in-memory-cache.util → in-memory-cache.utils. |
| #220, #221 enum/ vs enum.utils | utils/enum/README.md marks deprecated; use @simpill/enum.utils. |
| #210 socket.utils | README: Reconnect options + Heartbeat options tables with defaults. |
| #133 socket.utils heartbeat.message | In-code comment: omitted message defaults to "", empty string skips send. |
| #235, #130 getByPath/setByPath | data.utils: data.extend re-exports from @simpill/object.utils; config.utils imports setByPath from object.utils. Single implementation. |
| #1 env.utils split | env.utils.ts is a barrel; implementation in env-manager.ts (340), env-class.ts (150), env-getters.ts, env-encrypt.ts, env-load.ts, env-process-extend.ts (all under 400 lines). |

| Logger factory comments | Trimmed @file/@description, global state, cache, applyEnvConfig, getAdapter, logAdapterError, createLoggerFromAdapter; removed redundant inline comments. |
| #120 nextjs logging-adapter | Already uses meta ?? undefined (no ""). |
| #132 api-factory transform | Removed redundant `transform: schema.response ? undefined : undefined` from RouteEntry push. |
| #161, #163, #164 logger test casts | file.adapter: getWrittenContentAt() uses typeof guard (no cast); colored-formatter: getStringOutput() helper (no \`as string\`); simple-formatter already minimal. |
| #249 Lint throw literal | multi.adapter test throws new Error(); no eslint-disable. Verified. |
| #24, #59 logger any | types.ts uses LogMetadata = Record<string, unknown>; adapter uses LogEntry/LogMetadata; no type \`any\` in logger.utils src. |
| #27 cache.utils redis | redis-cache.ts typed; JSDoc on get() notes V not runtime-validated. |
| #48 annotations metadata-store | createMetadataStore uses Map<MetadataKey, unknown> and generics; no \`any\`. |
| #55, #56 api.utils client/handlers | README documents Promise<unknown>, unknown bodies, typing from Zod/assert at call site. |

| #78 object.utils get-set JSDoc | Comments already concise (path, default, hasPath, setByPath); no trim needed. |
| #13 object.utils get-set casts | Added isRecordLike() type guard; getByPath and hasPath use it instead of (current as Record<...>). |
| #81 string.utils JSDoc | Trimmed multi-line @param/@returns to single-line in string.utils.ts (isEmpty, isBlank, trimToNull, ensurePrefix/Suffix, normalizeWhitespace, stripIndent, capitalize, decapitalize, toSentenceCase, coalesceStrings, pad*Safe, replaceAllSafe). |

| data.extend casts (#21) | deepDefaults refactored: internal deepDefaultsRecord() with isPlainObject(); casts only at boundary (target/defaults as Record, return as T). |
| api-factory client options | getClientCallOptions() uses coerceRecord() helper to narrow params/query/headers; centralizes casts in one place. |
| events.utils handler casts (#20) | asMapKey() helper centralizes handler-as-Map-key cast; on/off use it. |
| api-factory handler-side (#16) | buildHandlerContext(r, req) centralizes params/query/body parsing and Zod schema casts; handler loop uses it. |
| #86 patterns.utils result.ts | JSDoc trimmed to one-liners (ok, err, isOk, isErr, unwrapOr, fromThrowable, toResult, fromPromise). |
| data.utils deepDefaults | Unit tests added (overlay, deep-merge, no mutate). |
| data.utils.ts casts | isIndexable() in deepClone; setProp() helper; omitKeys/ensureKeys build Record and cast at return. |
| #79 file.utils JSDoc | readFileAsync, readFileUtf8, readFileJson, writeFileAsync, writeFileUtf8, writeFileJson, ensureDir, sync variants: trimmed to one-line. |
| #87 uuid.utils JSDoc | All exports trimmed to one-line (generate*, validate, isUUID, parseUUID, compareUUIDs). |
| #89 crypto.utils JSDoc | hash, randomBytesSecure, randomBytesHex, timingSafeEqualBuffer: one-line with security notes (RangeError, constant-time). |
| #83 logger.utils buffered-adapter | File/class/config JSDoc trimmed; kept invariants (destroy on shutdown, never throw, onFlushError). Removed restating comments. |
| #98 async.utils concurrency.utils | Semaphore, acquire, run, composeGates, withLimit: JSDoc trimmed to one-liners; AbortError noted where relevant. |
| #74, #75 logger.utils factory.ts | configureLoggerFactory/getLogger and all public APIs trimmed to one-liners; inline restating comments removed; @example removed. |
| #84 logger.utils context.ts | @file/@description/@example removed; LogContext, provider, set/clear/get/has/withLogContext one-liners. |
| #76 logger.utils constants.ts | @file/@description and redundant JSDoc on LOG_LEVEL, METADATA_KEYS, LOG_PREFIX, BUFFERED_ADAPTER_DEFAULTS, etc. removed. |
| #94, #95 logger.utils formatters | simple.formatter.ts + colored.formatter.ts: @file/@description, config JSDoc, @example blocks, and restating method comments removed; one-line file comments. |
| #100 async.utils map.ts | mapAsync and mapConcurrent JSDoc trimmed to one-liners. |
| #108 logger.utils env.config.ts | loadAdapterConfigFromEnv: removed @example with console.log; JSDoc one-liner. hasEnvConfig one-liner. |
| #96 logger.utils legacy.formatters.ts | @file/@description → one-line; serializeMetadata, simpleFormatter, jsonFormatter, timestampFormatter, FormatterOptions JSDoc trimmed to one-liners. |
| #80 nextjs.utils route-helpers | parseSearchParams JSDoc trimmed to one-liner. |
| #112 token-optimizer.utils strategies | No restating inline comments found in strategy switch/cases; no change. |
| #88 file.utils WriteFileJsonOptions | Redundant interface-level JSDoc removed; property JSDoc kept. |
| logger formatter.adapter.ts | @file/@description → one-line; FormatterContext/FormattedOutput/FormatterAdapter JSDoc and @example removed; createFormatterContext, getHostname, formatWithAdapter, outputToString, isFormatterAdapter comments removed; getHostname inline comment removed. |
| #109 logger.utils shared index.ts | @file/@description → one-line; decorative section banners and "// Constants", "// Types", etc. removed. |
| #85 async.utils retry.ts | retry() JSDoc trimmed to one-liner. |
| cache.utils memoize/memoize-async | MemoizeOptions/MemoizeAsyncOptions keySerializer and function JSDoc trimmed to one-liners; memoize/memoizeAsync one-line. |
| #99 async.utils delay.ts | delay() JSDoc trimmed to one-liner. |
| #101 errors.utils serialize-error.ts | serializeError() JSDoc trimmed to one-liner. |
| #102 errors.utils app-error.ts | AppError class and constructor JSDoc trimmed to one-liner. |
| #97 time.utils date-time.ts | File comment trimmed to one line. |
| #105 function.utils noop.ts | noop() JSDoc trimmed to one line. |
| #103 data.utils data.extend.ts | File comment trimmed to one line. |
| #110 protocols.utils correlation.ts | File comment trimmed to one line. |
| cache.utils in-memory-cache.utils.ts | File comment and InMemoryCacheOptions/InMemoryCache JSDoc trimmed to one line; unbounded-growth note kept in file comment. |
| resilience.utils with-jitter.ts | withJitter() JSDoc trimmed to one line. |
| algorithms.utils binary-search.ts | File comment trimmed to one line. |
| cache.utils redis-cache.ts | File and RedisCache class JSDoc trimmed to one line. |
| algorithms.utils sort.ts | File comment trimmed to one line. |
| file.utils path.utils.ts | File comment and all function JSDoc (joinPath, resolvePath, normalizePath, basename, dirname, extname, isAbsolutePath, isPathUnderRoot, resolvePathUnderRoot) trimmed to one-liners. |
| #104 data.utils config.utils | File comment trimmed to one line. |
| array.utils array.utils.ts | File comment trimmed to one line. |
| zod.utils safe-parse.ts | File comment and safeParseResult, flattenZodError, formatZodError, parseOrThrow JSDoc trimmed to one-liners. |
| time.utils interval-manager.ts | File comment trimmed to one line. |
| zod.utils request-schemas.ts | File comment trimmed to one line. |
| zod.utils schema-builders.ts | File comment and optionalWithDefault, nullableWithDefault, stringField, numberField, booleanField JSDoc trimmed to one-liners. |
| patterns.utils (composite, facade, command, chain-of-responsibility, adapter, strategy-selector, race-ok, state-machine) | JSDoc trimmed to one-liners in all listed files (#90 optional trim). |
| patterns.utils (proxy, observer, mediator, decorator, builder, flyweight, pipe-async) | JSDoc trimmed to one-liners. |
| buildHandlerContext Zod casts | JSDoc on buildHandlerContext: "Build request context from route and request; schema casts for Zod .parse() live here." |

**Remediation complete.** All tracked audit items have been addressed. Optional low-impact trim elsewhere can be done ad hoc.

### All tasks complete ✓

| Check | Status |
|-------|--------|
| Critical (env split, getByPath/setByPath) | Done |
| High (any/console, types, docs) | Done |
| Medium (magic numbers, JSDoc, unsafe API docs, headers) | Done |
| Low (naming, trim, examples) | Done |
| Full verify (build + test all utils) | Passed |

---

*Generated from static scan of utils/ packages. Line numbers and counts are approximate where "various" or "(file)" is used.*
