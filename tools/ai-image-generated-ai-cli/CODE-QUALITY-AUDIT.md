# Code Quality Audit: image-ai-generatored-cli

Scope: `repo-sandbox/image-ai-generatored-cli` (packages/core, packages/cli, apps/web).

---

## Summary

- **Overall code health:** Fair. Structure is clear and boundaries are mostly respected. Main issues: type casting in adapters, duplicated logic, one no-op, global registry mutation from request path, and missing exhaustiveness in the engine factory.
- **High-risk areas:** Adapters (casts and SDK response shaping), CLI argv parsing (no-op and loose option typing), web app (server-side mutation of global registry on every request).
- **Common patterns:** Repeated adapter structure (good for consistency), repeated `mapAspectToSize` (bad), use of `as` to satisfy `Uint8Array`/option types (technical debt).

---

## Findings Table

| File | Line | Category | Severity | Issue | Why It's Bad | Recommended Fix |
|------|------|----------|----------|--------|--------------|-----------------|
| packages/core/src/adapters/gemini.ts | 41 | TypeScript | Medium | `part as { type?: string; data?: string }` | Cast hides real SDK type; breaks if API shape changes. | Define a minimal type or type guard for image output and narrow instead of casting. |
| packages/core/src/adapters/gemini.ts | 52 | TypeScript | Medium | `images as GenerateResponse["images"]` | Cast used to silence ArrayBufferLike vs ArrayBuffer. | Widen schema to accept `Uint8Array` (buffer type) or use a type guard; avoid `as`. |
| packages/core/src/adapters/openai.ts | 37 | Junior | Low | `response_format: request.outputFormat === "png" ? "b64_json" : "b64_json"` | Dead branch; always b64_json. | Use `response_format: "b64_json"`. |
| packages/core/src/adapters/openai.ts | 48 | TypeScript | Medium | `images as GenerateResponse["images"]` | Same as Gemini; cast to satisfy strict buffer type. | Same as above: widen schema or type guard. |
| packages/core/src/adapters/openai.ts | 70 | TypeScript | Low | `mapAspectToSize(ratio: string)` | Parameter is `string`; callers pass a known union. | Type as `GenerateRequest["aspectRatio"]` or a named union. |
| packages/core/src/adapters/xai.ts | 56 | TypeScript | Medium | `images as GenerateResponse["images"]` | Same adapter cast pattern. | Same as above. |
| packages/core/src/adapters/xai.ts | 77 | Duplication | Medium | `mapAspectToSize` duplicated from openai.ts | Same logic in two files; drift risk. | Extract to shared util (e.g. `packages/core/src/adapters/aspect.ts`) and use in both. |
| packages/core/src/adapters/openai.ts | 70-81 | Duplication | Medium | `mapAspectToSize` duplicated in xai.ts | Same as above. | Same: single shared implementation. |
| packages/core/src/factory.ts | 33-35 | TypeScript | Low | `default` branch throws but no exhaustiveness check | If a new engine is added and the switch is not updated, TS does not error. | Use `const _: never = engineId` before throw (and allow the unused var via eslint rule for exhaustiveness). |
| packages/core/src/guard.ts | 20 | Documentation | Low | Rejection reason is generic: "matched guard pattern" | Hard to debug or log which pattern fired. | Return pattern index or a stable pattern id in `GuardResult` (or a short code) for logging. |
| packages/core/src/registry.ts | 24 | Contract | Low | `registerPrompts(entries: PromptEntry[])` but `registerPrompt(entry: PromptEntryInput)` | Slight inconsistency; Input allows partial, so registerPrompt is more permissive. | Document that registerPrompts expects full entries, or unify to PromptEntryInput and normalize inside. |
| packages/cli/src/cli.ts | 22 | Bug | Medium | `key = arg.slice(2).replace(/-/g, "-")` | No-op; replace dash with dash. | Remove the `.replace(/-/g, "-")` call. |
| packages/cli/src/cli.ts | 46-49 | TypeScript | Low | `getEngineFromOptions` uses `e as EngineId` after includes check | Cast is safe at runtime but weakens type flow. | Use a type guard: `function isEngineId(s: string): s is EngineId { return ENGINE_IDS.includes(s as EngineId); }`. |
| packages/cli/src/cli.ts | 53-80 | Logic | Low | `printHelp(commandName)` always uses `getCLIEngine("gemini")` for engine help | User may have selected --engine openai/xai; help then shows Gemini-specific commands. | Pass current engineId into printHelp and use getCLIEngine(engineId) for engine-specific help. |
| packages/cli/src/cli.ts | 13 | Types | Low | `options: Record<string, string \| string[] \| boolean>` | Missing undefined for missing keys; optional options are implicitly undefined. | Type as `Record<string, string \| string[] \| boolean \| undefined>` or use a typed options interface. |
| packages/cli/src/run-generate.ts | 42-44 | Readability | Low | `dir` / `oneFileName` logic is dense | Hard to skim for "single file vs directory" behavior. | Add a one-line comment: "Single image to file path vs N images to directory with timestamped names." |
| packages/cli/src/run-config.ts | 6-11 | Junior | Low | Ternary chain for id -> ENV_KEYS mapping | Verbose and repetitive. | Use a const map: `const ENGINE_ENV_KEY: Record<EngineId, string> = { gemini: ENV_KEYS.GEMINI_API_KEY, ... }`. |
| apps/web/app/page.tsx | 31-33 | Architecture | Medium | `registerPrompts(SEED_PROMPTS)` and `discoverPrompts({})` at module load in a Server Component | Global in-memory registry is mutated on every request; idempotent but still global state in request path. | Seed once (e.g. in layout, or a dedicated init module run at app startup / instrumentation) or pass prompts via config/env instead of mutating core registry. |
| apps/web/app/prompt-discovery-client.tsx | 6 | Duplication | Low | `ENGINE_IDS` redefined locally | Same constant as in core; can drift. | Import `ENGINE_IDS` from `@simpill/image-ai-core`. |
| apps/web/app/prompt-discovery-client.tsx | 72-73 | TypeScript | Low | `(e.target.value \|\| "") as EngineId \|\| ""` | Cast without validation. | Validate: if value is in ENGINE_IDS then set as EngineId, else set "". |
| apps/web/app/layout.tsx | 15 | Styling | Low | Inline styles only | Works but scales poorly; no design tokens. | Optional: introduce CSS module or Tailwind and use tokens for spacing/typography. |
| apps/web/app/page.tsx | 36-42 | React | Low | Inline styles in JSX | Same as layout; consistency and maintainability. | Same: consider shared styles or design system. |

---

## Pattern Analysis

- **Adapters:** All three adapters use the same pattern: `images as GenerateResponse["images"]`. That indicates the schema (or lib typings) is stricter than the runtime value. Fix once in the type system or a shared helper.
- **Help text:** getHelp() in each adapter is nearly identical (only name/description differ). Could be generated from a shared spec keyed by engineId to reduce copy-paste.
- **AI/junior cues:** The no-op `.replace(/-/g, "-")` and the redundant ternary in OpenAI look like copy-paste or autocomplete mistakes. The rest is consistent and readable.

---

## Remediation Plan

### 1. Overview

- **Goals:** Remove unsafe casts, eliminate duplication, fix the CLI no-op, stop mutating global registry in the request path, tighten types and exhaustiveness.
- **Non-goals:** Full redesign of the CLI or web UI; changing public API of core beyond adding types or optional fields.
- **Principles:** Prefer types over casts; one place for each piece of logic; no global state mutation in per-request code.

### 2. Phases and Tasks

**Phase 1 – Type safety and dead code**

- Remove `images as GenerateResponse["images"]` in all three adapters: either widen the schema to accept `Uint8Array` (or a branded type) or add a small helper that returns a correctly typed array. Prefer no cast.
- Replace Gemini output cast with a type guard or a minimal typed interface for "image" output parts.
- Add exhaustiveness in factory default: `const _: never = engineId; throw ...` and allow the unused variable in eslint for that line.
- Fix CLI no-op: delete `.replace(/-/g, "-")` in parseArgv.
- Simplify OpenAI: use `response_format: "b64_json"` only.

**Phase 2 – Duplication and constants**

- Extract `mapAspectToSize` to a shared module (e.g. `packages/core/src/adapters/aspect.ts`); use from openai and xai. Type the argument as the aspect-ratio union.
- In run-config, introduce `ENGINE_ENV_KEY: Record<EngineId, string>` and use it instead of the ternary chain.
- In prompt-discovery-client, import `ENGINE_IDS` from core and, if needed, validate select value against it instead of casting.

**Phase 3 – CLI behavior and options typing**

- Type CLI options as an interface or `Record<... | undefined>` so missing keys are explicit.
- Add a type guard for engine id and use it in getEngineFromOptions.
- Pass current engineId into printHelp and use getCLIEngine(engineId) for engine-specific help.

**Phase 4 – Web app and guard**

- Seed prompts once: move registerPrompts to a layout that runs once, or to an init path (e.g. instrumentation or a dedicated setup used by dev/build), so the server component does not mutate the global registry on every request.
- Optionally improve guard: extend GuardResult with a field (e.g. pattern index or code) so callers can log or display which rule rejected the prompt.

**Phase 5 – Documentation and polish**

- Add a short comment in run-generate explaining single-file vs directory output behavior.
- Optionally document PromptEntryInput vs PromptEntry in core (who may pass what to registerPrompt/registerPrompts).
- Optional: replace inline styles in web app with CSS modules or Tailwind and tokens.

---

## Assumptions and Clarifications

- **Adapter casts:** Assumed the SDK response types use `ArrayBufferLike` or similar; the fix is to align schema or types so that valid Uint8Arrays are accepted without cast.
- **Registry seeding:** Assumed the web app is the only consumer that seeds the registry. If other apps in the same process also seed, the "seed once" approach should be coordinated (e.g. one init module for the process).
- **Help per engine:** Assumed we want help text to reflect the currently selected engine when the user passed `--engine`; if help is intentionally always Gemini, the finding can be closed as won’t fix.
- **Exhaustiveness:** Using `const _: never = engineId` will require an eslint exception for that unused variable (e.g. `// eslint-disable-next-line @typescript-eslint/no-unused-vars`) or a rule that allows `_` for exhaustiveness checks.
