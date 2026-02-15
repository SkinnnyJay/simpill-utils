# Image AI Toolkit

Standalone TypeScript toolkit for image generation: core SDK (`@simpill/image-ai-core`), CLI (`ai-image-gen`), and prompt discovery web UI. Strict types, Zod validation, swappable engines (Gemini, OpenAI, xAI), and a basic prompt-injection guard.

---

## Structure

| Package | Name | Purpose |
|--------|------|---------|
| **packages/core** | `@simpill/image-ai-core` | Engine interface, Zod schemas, prompt registry, guard, adapters (Gemini, OpenAI, xAI), factory singleton. |
| **packages/cli** | `@simpill/image-ai-cli` | CLI binary `ai-image-gen`: `list-models`, `discover`, `generate`, `config`, `help`. |
| **apps/web** | `@simpill/image-ai-web` | Next.js App Router app for prompt discovery (search, tags, engine hint). |

---

## Scripts (from repo root)

| Script | Description |
|--------|-------------|
| `npm install` | Install dependencies for all workspaces. |
| `npm run build` | Build all workspaces (core → cli → web). |
| `npm run typecheck` | Type-check all workspaces. |
| `npm run test` | Run tests in all workspaces (core + cli; web passes with no tests). |
| `npm run lint` | Lint all workspaces. |
| `npm run clean` | Remove `node_modules` and `dist` in workspaces. |
| `npm run dev` | Start Next.js dev server (apps/web) at http://localhost:3000. |
| `npm run cli` | Run built CLI (builds cli first): `npm run cli -- help`. |
| `npm run image` | Build CLI and run generate: `npm run image -- --prompt "…" [--engine gemini\|openai\|xai]`. |

Per-package scripts (run from `packages/core`, `packages/cli`, or `apps/web`):

- `npm run build` — compile (core/cli: emit to `dist`; web: Next.js build).
- `npm run typecheck` — `tsc --noEmit`.
- `npm run test` — `vitest run` (web: `--passWithNoTests`).
- `npm run lint` — ESLint (core/cli) or `next lint` (web).
- `npm run clean` — remove `dist` (core/cli only).

---

## CLI usage

Binary name: **`ai-image-gen`**. After building the repo (or `npm run build -w @simpill/image-ai-cli`):

```bash
# From repo root (convenience script builds cli then runs it)
npm run cli -- help
npm run cli -- list-models --engine gemini
npm run cli -- discover --tag game --query sprite
npm run cli -- config
npm run cli -- generate --prompt "a cat" --engine gemini --out ./out
npm run cli -- generate --prompt "portrait" --count 2 --out ./outputs

# Or run the built file directly
node packages/cli/dist/cli.js generate --prompt "isometric sprite" --engine gemini
```

**Generate behavior:**

- `--out` omitted: files written to current directory as `generated-{timestamp}-{i}.png`.
- `--out <dir>` (no extension): directory; files named `generated-{timestamp}-{i}.png`.
- `--out <file>` (e.g. `./out.png`) with one image: write that file.
- `--out <file>` with multiple images (`--count 2`+): write to same directory as file, names `generated-{timestamp}-{i}.png` (no overwrite).

**Asset / spritesheet mode (for pipelines like Red Alert SHP round-trip):**

When you pass **all three** of `--input-image`, `--input-meta`, and `--output-image`, the CLI uses the first as a reference image and the meta for layout (frame dimensions/count). The generated image is written to `--output-image`; optional `--output-meta` copies the input meta so downstream tools get the same layout.

- **Input meta** must be JSON with at least: `frameWidth`, `frameHeight`, `frameCount` (see `spritesheetMetaSchema` in core).
- The engine receives the reference image (base64) and your prompt; output is written to the given path.

```bash
npm run cli -- generate --prompt "same style, snow theme" \
  --input-image ./spritesheet.png --input-meta ./meta.json \
  --output-image ./out/generated.png --output-meta ./out/meta.json
```

**Registered tools (extensions):**

- `list-tools` — list built-in and registered asset tools.
- `run-tool --tool <id>` — run a tool by id. Built-in: `spritesheet` (same as generate with asset args). Custom tools register via `registerTool()` from `@simpill/image-ai-core` and are invoked with `--input-image`, `--input-meta`, `--output-image`, `[--output-meta]`, `[--prompt]`, `[--engine]`.

```bash
npm run cli -- list-tools
npm run cli -- run-tool --tool spritesheet --input-image ./in.png --input-meta ./meta.json --output-image ./out.png --prompt "variation"
```

---

## Web app

```bash
npm run dev
```

Then open http://localhost:3000 for the prompt discovery UI (search, tags, engine hint). Server-side uses core’s `registerPrompts` / `discoverPrompts`; no engine or Node-only code is bundled in the client.

---

## Environment

Copy `.env.sample` to `.env` or `.env.local` and set keys for the engines you use:

- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`
- Optional: `GEMINI_API_MODEL`, `OPENAI_API_MODEL`, `XAI_API_MODEL` (defaults are in core).

CLI and adapters read `process.env`; the web app only uses the core registry (no API keys in the browser).

---

## Consuming the core package

Other apps (e.g. another Next.js app) can depend on the core SDK:

```ts
import {
  getEngine,
  checkPromptGuard,
  discoverPrompts,
  registerPrompts,
  registerTool,
  getTool,
  listTools,
  generateRequestSchema,
  spritesheetMetaSchema,
} from "@simpill/image-ai-core";
```

- **Asset tools:** implement `AssetTool` and call `registerTool(tool)` so the CLI’s `run-tool` command can invoke it. Contract: `AssetToolArgs` (inputImagePath, inputMetaPath, outputImagePath, outputMetaPath?, prompt?, engineId?) → `Promise<AssetToolResult>`.

- **npm workspaces:** use `"@simpill/image-ai-core": "*"` in the consuming package.
- **pnpm:** use `"@simpill/image-ai-core": "workspace:*"`.

---

## Production builds and dependencies

- **packages/core** and **packages/cli** set `"files": ["dist"]`, so only `dist` is published; **devDependencies** (TypeScript, Vitest, ESLint, etc.) are not included in the published tarball.
- **apps/web** is an application: `next build` only bundles **dependencies**; devDependencies are not included in the production output.
- Root **package.json** has only **devDependencies**; no production runtime deps at the repo root.

---

## Tests

- **Core:** unit tests for Zod schemas, prompt guard, and prompt registry (Vitest).
- **CLI:** engine singleton and help wiring.
- **Web:** `vitest run --passWithNoTests` (no tests yet; scaffold only).

Run all: `npm run test` from repo root.

---

## Review notes (audit)

- **Bugs:** Multi-image `generate` with `--out <file>` previously wrote all images to the same path; fixed by using a directory + timestamped names when count > 1.
- **Performance:** In-memory prompt registry has no size limit; acceptable for current use; add a cap or persistence later if needed.
- **Security:** Prompt guard uses a denylist of common injection patterns; validate and sanitize inputs at API boundaries when integrating.
- **Docs:** This README; `.env.sample` lists only vars used by this toolkit.
