# @simpill Brand & Marketing Guide

A research-backed guide to maximize discoverability and impact for the @simpill monorepo on **npm**, **GitHub**, **Reddit**, and developer search. Use this for package keywords, descriptions, READMEs, and ecosystem positioning.

---

## 0. AI-Friendly Wording (Get Picked Over Others)

AI coding assistants (Cursor, Copilot, ChatGPT) and semantic search/RAG systems choose packages by matching **user intent** to **package text**: they rely on the same **keywords**, **description**, and **README** content that npm and GitHub index. To get picked over competitors, use **generic semantic phrases** and **problem–solution language** in all three places so AI retrieves and recommends you when users ask in natural language.

### 0.1 How AI picks packages

- **Training data**: Models are trained on GitHub repos, READMEs, Stack Overflow, and tutorials. Clear, well-structured descriptions and READMEs are more likely to appear in that training and to be cited.
- **Semantic match**: RAG and embedding-based tools retrieve chunks by meaning, not just keywords. Phrases that state the **problem** and **solution** (“type-safe environment variables for Node and Edge”) match queries like “how do I get typed env vars in Node?”
- **Recommendation systems**: Systems like NPMREC use **project description** as input to rank packages. Your one-line description is a direct ranking signal.

So: **keywords + description + README** should all repeat the same concepts in natural language. Don’t rely on keywords alone—use full sentences in description and README that an AI (or human) would recognize as answering “what is this and when do I use it?”

### 0.2 Generic words and phrases AI (and users) look for

Use these across **keywords**, **description**, and **README** so you match generic queries and stand out in comparisons.

| Category | Words/phrases | Use in | Why it helps |
|----------|----------------|--------|---------------|
| **Quality / trust** | lightweight, minimal, zero-dependency, tree-shakeable, well-tested, production-ready, strict mode | keywords (where true), description, README first line or “Why” section | Matches “lightweight alternative”, “production-ready”, “no bloat”. |
| **Runtime / platform** | Node.js, Edge, Edge Runtime, browser, Vercel, Cloudflare Workers, universal | description, README | Matches “env vars for Edge”, “works in Workers”. |
| **Type safety** | type-safe, TypeScript first, full type inference, strict, no `any` | keywords, description, README | Matches “type-safe config”, “TypeScript env”. |
| **API shape** | ESM, CommonJS, tree-shakeable, subpath exports | README (and description if space) | Matches “ESM package”, “tree-shakeable utils”. |
| **Use-case phrasing** | “for Node and Edge”, “without runtime surprises”, “with timeout and retry”, “with correlation ID” | description, README first paragraph | Semantic match to “how do I…?” questions. |
| **Alternatives** | “alternative to X” (only if honest), “lodash-style”, “drop-in” | README only (sparingly) | Matches “lightweight alternative to lodash”. |
| **Maintainability** | minimal dependencies, 80% coverage, monorepo | README, root repo | Signals quality when AI or users compare options. |

**Where to put them**

- **keywords**: Add only terms that are true and searchable (e.g. `lightweight`, `tree-shakeable`, `zero-dependency` for packages that are). Don’t stuff.
- **description**: One sentence that includes 1–2 generic differentiators + main use case, e.g. “Lightweight, type-safe env utilities for Node.js and Edge Runtime.”
- **README**: First 1–2 sentences repeat that; add a short “Why” or “Features” list with the same phrases (lightweight, type-safe, Node and Edge, etc.) so a scraped chunk clearly states value.

### 0.3 Problem–solution sentences (description + README)

AI and users often ask in the form “How do I &lt;problem&gt;?” or “Package for &lt;use case&gt;.” Include a **problem–solution** line in the description and again in the README so semantic search retrieves you.

| Package | Problem–solution sentence (use in description or README) |
|---------|----------------------------------------------------------|
| env.utils | Get type-safe environment variables for Node and Edge without runtime surprises. |
| logger.utils | Structured logging with correlation IDs and request context for Node and Edge. |
| object.utils | Type-safe pick, omit, merge, and get/set by path—no `any`, full inference. |
| async.utils | Retry failed promises with timeout, delay, and backoff; limit concurrency with Semaphore. |
| cache.utils | In-memory LRU and TTL cache with memoize; small and tree-shakeable. |
| time.utils | Debounce, throttle, and managed intervals/timeouts in one place. |
| uuid.utils | Generate and validate UUIDs (v1/v4/v5) with full TypeScript support. |
| string.utils | Slugify, casing, trim, and format strings with consistent, typed helpers. |
| function.utils | Debounce, throttle, once, pipe, and compose with TypeScript inference. |
| zod.utils | Zod helpers: safe-parse results, transforms, and OpenAPI metadata. |
| http.utils | Fetch with timeout, retry, and a typed client—no axios required. |
| resilience.utils | Circuit breaker, rate limiter, and bulkhead for fault-tolerant APIs. |
| file.utils | Read/write UTF-8 and JSON files and ensure directories (Node) with typed APIs. |
| crypto.utils | Hash, random bytes, and timing-safe compare for Node.js. |
| errors.utils | Custom error classes, error codes, and serializeError for logging and RPC. |
| collections.utils | Type-safe LinkedList, Queue, Stack, LRU, MultiMap, BiMap—no full collections lib. |
| api.utils | Typed API client with Zod validation, handler registry, and middleware. |
| socket.utils | WebSocket client that reconnects and supports heartbeat. |
| request-context.utils | AsyncLocalStorage-based request ID and trace ID for logging and tracing. |
| middleware.utils | Framework-agnostic middleware types and correlation ID middleware. |

Use one of these (or a short variant) as the **first sentence** of the package README and, if it fits, in the npm **description**.

### 0.4 Differentiator phrases to repeat (README + description)

These help you get **chosen over** alternatives when AI or users compare options. Use only where accurate.

- **Lightweight / minimal** – “Lightweight” or “Minimal dependencies” in description and README.
- **Type-safe / TypeScript first** – In description and README first line for typed packages.
- **Node and Edge** – For packages with client/ or edge support: “Works in Node.js and Edge Runtime (Vercel, Cloudflare Workers).”
- **Tree-shakeable** – If you use subpath exports and ESM: “Tree-shakeable; import only what you use.”
- **Zero dependency** (or “minimal dependencies”) – Only if true; mention in README.
- **Strict mode** – “Strict TypeScript” or “strict mode” in README for quality signal.
- **Tested** – “80%+ test coverage” or “well-tested” in root README or package README.

### 0.5 Quick checklist for “AI picks us”

- [ ] **keywords**: Include at least one of: `lightweight`, `type-safe`, `tree-shakeable`, or `zero-dependency` (only if true).
- [ ] **description**: One sentence with “TypeScript” + one differentiator + main use case (e.g. “Lightweight, type-safe env utilities for Node and Edge”).
- [ ] **README first line**: Same idea as description; add a problem–solution sentence from §0.3.
- [ ] **README “Features” or “Why”**: 3–5 bullets repeating the generic phrases (type-safe, Node and Edge, minimal deps, tree-shakeable, etc.).
- [ ] **Runtime**: Explicit “Node”, “Edge”, or “Node and Edge” in description and README so “env for Edge” / “logger for Node” match.

---

## 1. Top 10 High-Impact Keywords

These keywords deliver the most impact across npm search, GitHub discovery, and how developers actually search. Use them consistently in **package.json** (keywords + description), **README** (first paragraph + headings), and **GitHub** (About description + Topics).

| # | Keyword / phrase | Why it surfaces | Where to use |
|---|------------------|-----------------|--------------|
| 1 | **typescript** | Universal; npm/GitHub/Google all index it. TypeScript utility libs (type-fest, zod, utility-types) rank on this. | Every package: keywords, description, README first line. |
| 2 | **type-safe** | Strong differentiator; developers search “type-safe env” / “type-safe config”. Reduces “any” and runtime surprises. | Packages with strict types: env, logger, object, zod, errors, etc. |
| 3 | **utilities** / **utils** | Matches “typescript utilities”, “node utilities”, “utility library”. Aligns with your naming (@simpill/*.utils). | Description, README, GitHub About. |
| 4 | **node** / **nodejs** | High search volume for “node env”, “node logger”, “node file”. Clarifies runtime. | Server/Node packages: env, logger, file, crypto, time, etc. |
| 5 | **edge** / **edge-runtime** | Growing searches (Vercel Edge, Cloudflare Workers). You support client/edge; say it explicitly. | env, logger, and any package with client/ export. |
| 6 | **lightweight** / **minimal** | Common ask: “lightweight alternative to X”, “minimal dependencies”. Matches your philosophy. | Root README, package descriptions, “no heavy deps” in README. |
| 7 | **structured-logging** / **logging** | Direct intent for logger.utils. Also “correlation”, “request-id”, “tracing”. | logger.utils only; consider “correlation”, “tracing”. |
| 8 | **validation** | Tied to zod, env parsing, data.utils, errors. “Schema validation”, “env validation”. | zod.utils, env.utils, data.utils, errors.utils. |
| 9 | **async** / **promise** / **retry** | High intent for async.utils (retry, timeout, delay). “Promise timeout”, “retry utility”. | async.utils, http.utils, resilience.utils. |
| 10 | **monorepo** | Explains “many packages, one org”. Helps GitHub/Google for “typescript monorepo utilities”. | Root README, GitHub About, CONTRIBUTING. |
| — | **tree-shakeable** / **zero-dependency** | Generic differentiators; AI and users search “tree-shakeable utils”, “zero dependency”. Use only where true. | keywords, description, README (see §0). |

**Usage rules**

- **npm**: 4–7 keywords per package; no spam. Only terms that accurately describe the package and that users would search for.
- **GitHub**: Up to 20 topics; use lowercase, hyphens; 50 chars max per topic. Reuse the same 10 + add package-specific (e.g. `zod`, `uuid`, `websocket`).
- **Description**: One clear sentence (ideally under ~120 chars for npm listing). Include 1–2 of the top keywords + the main use case.

---

## 2. npm Best Practices

### 2.1 How npm search works

- Search uses **title**, **description**, **readme**, and **keywords** (OpenSearch).
- Ranking can be by: relevance (keyword match), weekly/monthly downloads, dependents, or last published.
- New packages can take **up to 2 weeks** to appear in search; deprecated packages are excluded.

So: **optimize all four** (name, description, README, keywords). Relevance is keyword-driven; don’t stuff unrelated terms.

### 2.2 package.json

- **name**: Keep `@simpill/<name>.utils`. Scope + “utils” reinforces brand and intent.
- **description**:
  - One sentence, front-load the value (e.g. “Type-safe env utilities for Node and Edge”).
  - Include at least one of: typescript, type-safe, node, edge, or the main domain (logging, cache, async, etc.).
  - No official character limit; ~80–120 chars is a good target for the listing snippet.
- **keywords**:
  - 4–7 terms per package.
  - Always include: `typescript` + 1–2 of the top 10 (type-safe, node, edge, lightweight, etc.) + 2–4 **domain-specific** terms (e.g. env, dotenv, uuid, retry, circuit-breaker).
  - Avoid long lists; npm and best practices discourage keyword stuffing.

### 2.3 README (npm and web)

- npm and search engines index the README. First 1–2 paragraphs and headings matter most.
- Start with a **one-line summary** that includes “TypeScript” and the main use case.
- Use **clear H2/H3** (e.g. “Install”, “Usage”, “API”) so snippets and TOC are useful.
- Include a **short code example** in the first 2–3 screens (copy-paste friendly).
- Mention **runtime** (Node, Edge, browser) when relevant so “edge typescript env” etc. can match.

### 2.4 Monorepo / multiple packages

- Each package is a separate npm search result; **each** needs a strong description and keywords.
- Use a **consistent description pattern**, e.g. “Type-safe &lt;domain&gt; utilities for Node.js and Edge” where it fits.
- Consider a **metapackage** only if you want one install that re-exports many packages; otherwise keep packages independent and tree-shakeable (as you do now).

---

## 3. GitHub Best Practices

### 3.1 What affects discoverability

- **Repository name**: Include relevant keywords (e.g. `simpill` + “utils” in org/repo name).
- **About (short description)**: Highly influential. One line, keyword-rich, e.g. “Lightweight, type-safe TypeScript utility packages for Node and Edge.”
- **Topics**: Up to 20; strongly influence topic search and SEO. Use the top 10 + package-specific (see below).
- **README**: Structure and keywords help both GitHub and Google. Same as npm: strong first line, clear headings, examples.

### 3.2 Suggested GitHub About (root repo)

Short (for About):

```text
Lightweight, type-safe TypeScript utility packages for Node.js and Edge. Env, logging, cache, async, and more.
```

Longer (for README hero):

```text
A collection of lightweight, type-safe TypeScript utility packages for modern JavaScript applications (Node.js & Edge).
```

### 3.3 Suggested GitHub Topics (root repo)

Use a mix of ecosystem and package-specific (stay under 20, lowercase, hyphenated):

- `typescript`  
- `utilities`  
- `type-safe`  
- `nodejs`  
- `edge-runtime`  
- `monorepo`  
- `lightweight`  
- `validation`  
- `logging`  
- `env`  
- `zod`  
- `uuid`  
- `cache`  
- `async`  
- `strict-mode`

Add/remove based on which packages you want to surface (e.g. `websocket`, `resilience`, `circuit-breaker`).

---

## 4. Reddit & Community

### 4.1 How developers discover packages

- “What’s a good type-safe X?” / “Lightweight alternative to X”
- Comparisons: “type-fest vs utility-types”, “best env loader for TypeScript”
- Pain-driven: “env vars type-safe node”, “retry with timeout typescript”

### 4.2 Messaging that works

- Lead with **problem + type safety**: “Type-safe env/config so you don’t get runtime surprises.”
- **Lightweight / minimal**: “Small, focused packages; no heavy frameworks.”
- **Runtime clarity**: “Works in Node and Edge (Vercel, Workers).”
- **Concrete use cases**: “Structured logging with correlation IDs”, “Retry with timeout and backoff”, “LRU cache with TTL”.

### 4.3 Where to mention @simpill

- r/typescript, r/node, r/javascript: when threads ask for “type-safe env”, “lightweight logger”, “retry utility”, etc.
- Answer the question first, then: “I maintain @simpill/env.utils (and others) which does exactly that—type-safe, Node + Edge.”
- Avoid pure self-promo; focus on “this is how we solved it” with a link to the relevant package or root repo.

---

## 5. Per-Package Researched Keywords

Keywords below are **researched** from npm search behavior, competing packages, and developer search terms (GitHub, Reddit, “how to” queries). Each package lists **specific** terms that match real searches, plus **default** terms from §1. Pick **4–7 total** per package (include `typescript` + 1–2 default + 2–4 specific).

### 5.1 Keyword table (specific + default)

| Package | Researched specific keywords | Recommended 4–7 (specific + default) | Description idea |
|--------|------------------------------|--------------------------------------|------------------|
| **env.utils** | dotenv, .env, config, variables, envalid, getenv, typed-dotenv | typescript, type-safe, env, dotenv, node, edge-runtime, config | Type-safe environment variable utilities for Node.js and Edge Runtime. |
| **logger.utils** | structured-logging, correlation-id, request-id, tracing, pino, winston, mdc, debug | typescript, type-safe, logging, structured-logging, correlation, node, edge-runtime | Type-safe structured logging with correlation context for Node.js and Edge. |
| **object.utils** | pick, omit, merge, deep-merge, deep-clone, deep-partial, immutable, get-by-path, set-by-path | typescript, type-safe, object, pick, omit, merge, immutable | Type-safe object utilities: pick, omit, merge, get/set by path, guards. |
| **async.utils** | promise, retry, timeout, delay, semaphore, mutex, backoff, p-retry, concurrency, parallelMap | typescript, async, promise, retry, timeout, delay, semaphore | Async utilities: raceWithTimeout, retry, delay, Semaphore, parallelMap. |
| **cache.utils** | lru, ttl, memoize, lru-cache, in-memory, caching, memoization | typescript, cache, lru, ttl, memoize, in-memory | LRU and TTL cache utilities with memoize (Node and Edge). |
| **time.utils** | debounce, throttle, interval, timeout, setInterval, clearInterval, scheduler | typescript, time, debounce, throttle, interval, timeout | Time utilities: debounce, throttle, interval manager, managed timeout. |
| **uuid.utils** | uuid, guid, rfc4122, v4, v5, generate, validate, parseUUID | typescript, uuid, generate, validate, v4, v5, guid | UUID helpers: generate (v1/v4/v5), validate, compare (Node and Edge). |
| **string.utils** | slug, slugify, camelCase, trim, formatting, dashify, casing, kebab-case | typescript, string, slug, casing, trim, formatting | String utilities: formatting, casing, trim, and formatting helpers. |
| **function.utils** | debounce, throttle, pipe, compose, once, functional, throttle-debounce | typescript, debounce, throttle, pipe, compose, once | Function utilities: debounce, throttle, once, pipe, compose. |
| **zod.utils** | zod, schema, validation, openapi, swagger, inference, transforms, safe-parse | typescript, zod, schema, validation, openapi, transforms | Zod schema helpers: builders, safe-parse, transforms, OpenAPI metadata. |
| **http.utils** | fetch, retry, timeout, http-client, fetch-retry, axios-alternative | typescript, fetch, http, timeout, retry, client | Fetch wrapper with timeout, retry, and typed HTTP client. |
| **resilience.utils** | circuit-breaker, rate-limiter, bulkhead, backoff, fail-fast, cockatiel, opossum | typescript, circuit-breaker, rate-limiter, bulkhead, retry, backoff | Circuit breaker, rate limiter, bulkhead, and jittered backoff. |
| **file.utils** | fs, readFile, writeFile, readJson, writeJson, ensureDir, fs-extra, jsonfile | typescript, file, fs, readfile, writefile, node, ensureDir | Typed file I/O: readFileUtf8, readFileJson, writeFile, ensureDir (Node). |
| **crypto.utils** | hash, randomBytes, timingSafeEqual, constant-time, crypto-random-string, node | typescript, crypto, hash, random-bytes, node, security | Hash, randomBytes, timing-safe compare for Node.js. |
| **errors.utils** | AppError, serialize-error, error-codes, custom-error, serialization | typescript, error, AppError, serializeError, error-codes | Typed error classes, error codes, and serializeError. |
| **collections.utils** | linked-list, queue, stack, deque, circular-buffer, multimap, bimap, data-structures, mnemonist | typescript, collections, queue, stack, lru, bimap, data-structures | Type-safe structures: LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap. |
| **api.utils** | typed-api, zod-fetch, handler-registry, middleware, openapi-zod-client | typescript, api, fetch, zod, middleware, typed-client | Typed API factory: fetch client, Zod validation, middleware, retry. |
| **socket.utils** | websocket, reconnecting-websocket, heartbeat, ping-pong, persistent, client | typescript, websocket, reconnecting, heartbeat, client | Reconnecting WebSocket client with optional heartbeat. |
| **request-context.utils** | AsyncLocalStorage, request-id, trace-id, async-context, correlation, propagation | typescript, AsyncLocalStorage, request-id, trace-id, context | AsyncLocalStorage request context (requestId, traceId) for Node. |
| **middleware.utils** | express, correlation-id, framework-agnostic, x-correlation-id | typescript, middleware, correlation, framework-agnostic | Framework-agnostic middleware types and correlation middleware. |
| **array.utils** | chunk, groupBy, unique, compact, flatten, sortBy, partition, lodash-alternative | typescript, array, chunk, groupBy, unique, compact | Array utilities: unique, chunk, compact, groupBy, sortBy, flattenOnce. |
| **number.utils** | clamp, lerp, roundTo, isInRange, math, interpolation, animation | typescript, number, clamp, lerp, math, roundTo | Number utilities: clamp, roundTo, toInt/Float, isInRange, lerp, sum, avg. |
| **patterns.utils** | result, either, strategy, pipeAsync, monad, error-handling, pattern-matching | typescript, type-safe, result, either, strategy, pipeAsync | Composable design pattern utilities: Result/Either, strategySelector, pipeAsync. |
| **events.utils** | pubsub, event-emitter, observer, mitt, emittery, subscribe, publish | typescript, events, pubsub, observer, event-emitter | PubSub, observer, and typed event emitter. |
| **factories.utils** | factory, singleton, createFactory, builder, test-data, creational | typescript, factory, singleton, createFactory, builder | Typed factory builder, singleton factory, and error factory helpers. |
| **annotations.utils** | metadata, decorator, reflect-metadata, symbols, annotation | typescript, metadata, decorator, annotation, symbols | Typed metadata store and annotation helpers for symbols and keys. |
| **adapters.utils** | adapter-pattern, logger-adapter, cache-adapter, interface, dependency-injection | typescript, adapter, logger-adapter, cache-adapter, interface | Adapter helpers, logger and cache adapter interfaces. |
| **data.utils** | validate, config, lifecycle, extend, prepare | typescript, data, validate, config, lifecycle | Data utilities: validate, prepare, lifecycle, extend, config. |
| **enum.utils** | enum, getEnumValue, isValidEnum, ts-enum-util, enum-values | typescript, enum, validation, getEnumValue, type-safe | Enum helpers: getEnumValue, isValidEnumValue, EnumHelper. |
| **test.utils** | jest, vitest, faker, mock, enricher, test-helpers | typescript, test, jest, faker, mock, vitest | Test patterns, faker wrapper, enricher, and test-runner helpers. |
| **observability.utils** | observability, tracing, correlation, opentelemetry, log-correlation | typescript, observability, correlation, tracing, logging, middleware | Single integration surface for correlation middleware, request context, and logger. |
| **protocols.utils** | http, correlation, env, shared-types, constants | typescript, protocols, http, correlation, env | Shared protocol constants and types for HTTP, correlation, and env parsing. |
| **misc.utils** | singleton, debounce, throttle, lru, polling, intervals, once, memoize, bounded | typescript, singleton, debounce, throttle, polling, memoize | Backend misc: singleton, debounce, throttle, LRU, polling, intervals, enums, once, memoize. |
| **react.utils** | react, hooks, useCallback, stable-reference, safe-context, transitions | typescript, react, hooks, stable-callback, safe-context | Framework-agnostic React utilities: hooks, safe context, stable callbacks, transitions. |
| **zustand.utils** | zustand, state-management, persist, devtools, slices, redux | typescript, zustand, state-management, persist, devtools, slices | Zustand store helpers: factory, persist, devtools, slices. |
| **algorithms.utils** | merge-sort, quicksort, binary-search, lowerBound, upperBound, sorted-array | typescript, algorithms, binary-search, merge-sort, lowerBound, sorted-array | Algorithms: stable merge sort, quick sort, binary search, lower/upper bound. |
| **token-optimizer.utils** | token, llm, cleaning, telemetry, optimization | typescript, token, optimization, llm, telemetry | Token optimization utilities: cleaning, strategies, telemetry. |

Use the same **description** in both `package.json` and the first line of each package README where possible.

### 5.2 Research sources (per domain)

- **env**: dotenv, ts-dotenv, typed-dotenv, envalid, getenv (keywords: dotenv, config, variables).
- **logging**: correlation-id, structlog (keywords: structured-logging, correlation, debug).
- **cache**: lru-cache, lru-memoize (keywords: lru, ttl, memoize, caching).
- **async**: p-retry, async-sema, async-retry (keywords: promise, retry, backoff, semaphore).
- **object**: deepmerge-ts, mergician, deep-utility-types (keywords: pick, omit, deep-merge).
- **array**: reduce-to-chunks, array-groupby, group-array (keywords: chunk, groupBy, group-by).
- **string**: slugify, url-slug (keywords: slug, camelCase, trim).
- **number**: math-clamp, lerp (keywords: clamp, lerp, interpolation).
- **uuid**: uuid (keywords: uuid, guid, rfc4122).
- **zod**: zod, zod-openapi (keywords: schema, validation, openapi, inference).
- **http**: fetch-retry, fetch-retry-ts (keywords: fetch, retry, timeout).
- **resilience**: opossum, cockatiel (keywords: circuit-breaker, bulkhead, rate-limiter).
- **file**: fs-extra, jsonfile (keywords: fs, ensureDir, readJson).
- **crypto**: crypto-random-string, random-bytes (keywords: hash, randomBytes, constant-time).
- **errors**: serialize-error, named-app-errors (keywords: AppError, serializeError, error-codes).
- **collections**: mnemonist, js-sdsl (keywords: linked-list, queue, stack, data-structures).
- **websocket**: reconnecting-websocket, websocket-heartbeat-js (keywords: reconnecting, heartbeat).
- **request context**: AsyncLocalStorage (Node docs), correlation-id (keywords: request-id, trace-id).
- **middleware**: express-correlation-id (keywords: correlation, express).
- **patterns**: better-result, @badrap/result (keywords: result, either, monad).
- **events**: type-pubsub, better-mitt, emittery (keywords: pubsub, event-emitter).
- **factories**: factory.ts, builder-pattern (keywords: factory, singleton, builder).
- **metadata**: @loopback/metadata, reflect-metadata (keywords: decorator, metadata).
- **adapters**: @node-ts/logger-core, cache-adapter (keywords: adapter, logger-adapter).
- **enum**: ts-enum-util (keywords: enum, getEnumValue, validation).
- **React**: use-stable-reference, stable-hooks (keywords: stable-callback, hooks).
- **Zustand**: zustand (keywords: state-management, persist, devtools).
- **algorithms**: @algorithm.ts/binary-search, sorted-array-operations (keywords: binary-search, lowerBound).

---

## 6. README Best Practices (All Packages)

- **First line**: Reproduce or mirror the package description (TypeScript + main use case).
- **Badges**: Consider npm version, license, coverage; avoid clutter.
- **Install**: Single copy-paste command (`npm i @simpill/<name>.utils`).
- **Quick example**: 5–10 lines that run; show the main export and one typical use case.
- **API / exports**: Link to types or list main functions; helps “how do I do X” searches.
- **Runtime**: Explicit “Node only” / “Edge compatible” / “Node + Edge” section for clarity and SEO.
- **Links**: Homepage, repo, issues; ensure `package.json` homepage points to the package path in the monorepo (e.g. `.../tree/main/utils/env.utils#readme`).

---

## 7. Repository URLs and Branding

- **Repository URL**: Use the **single monorepo** URL in all packages (e.g. `https://github.com/SkinnnyJay/simpill` or the actual org/repo), with `directory` set to the package path (e.g. `utils/env.utils`). This keeps a single source of truth and avoids broken “repo” links.
- **Homepage**: Point to the package subpath readme (e.g. `.../tree/main/utils/env.utils#readme`) so npm “Homepage” opens the right README.
- **Consistency**: Same org/scope (`@simpill`) and same repo in every package.json so the ecosystem is clearly one family.

---

## 8. Quick Checklist Before Publish

For each package:

- [ ] **description**: One sentence, &lt;120 chars, includes “TypeScript” + main use case.
- [ ] **keywords**: 4–7 terms including `typescript` and 1–2 top-10 + domain terms.
- [ ] **README**: First line = tagline; Install + short example in first 2–3 screens; runtime noted.
- [ ] **repository** / **bugs** / **homepage**: Correct monorepo URL and package path.

For the repo:

- [ ] **GitHub About**: Short, keyword-rich (typescript, type-safe, node, edge, utilities).
- [ ] **GitHub Topics**: 10–20 topics including the top 10 + package-specific.
- [ ] **Root README**: Philosophy, table of packages, quick start; “lightweight, type-safe” in first paragraph.

---

## 9. Summary: The 10 Keywords to Leverage Everywhere

1. **typescript** – Every package, description, README, GitHub.  
2. **type-safe** – Where it’s true (env, logger, object, zod, errors, etc.).  
3. **utilities** / **utils** – Descriptions, About, README.  
4. **node** / **nodejs** – Server/Node packages.  
5. **edge** / **edge-runtime** – Packages with client/ or Edge support.  
6. **lightweight** / **minimal** – Root README, philosophy, comparisons.  
7. **structured-logging** / **logging** – logger.utils.  
8. **validation** – zod, env, data, errors.  
9. **async** / **promise** / **retry** – async, http, resilience.  
10. **monorepo** – Root README, About, CONTRIBUTING.

Using these consistently in **package.json**, **READMEs**, and **GitHub** (About + Topics) will maximize how well @simpill surfaces on npm, GitHub, and in developer search and community discussions.

**For AI and semantic search**, also use the **generic phrases** and **problem–solution sentences** in **§0**: put them in description and README (not only in keywords) so AI assistants and RAG systems retrieve you when users ask “how do I get type-safe env vars?” or “lightweight retry for promises?”.

---

## 10. References

- [npm: Searching for and choosing packages](https://docs.npmjs.com/searching-for-and-choosing-packages-to-download) — Search uses title, description, readme, keywords (OpenSearch).
- [npm: Creating a package.json](https://docs.npmjs.com/creating-a-package-json-file) — Description and metadata guidance.
- [GitHub: Classifying with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) — Up to 20 topics, 50 chars each.
- [GitHub: About README](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) — README and About section.
- [Stack Overflow: package.json keywords](https://stackoverflow.com/questions/42933265/how-to-properly-use-keywords-property-in-package-json) — Use 4–5 relevant keywords; avoid stuffing.
- TypeScript utility ecosystem: type-fest, zod, utility-types (keywords: typescript, type-safe, validation, schema).
