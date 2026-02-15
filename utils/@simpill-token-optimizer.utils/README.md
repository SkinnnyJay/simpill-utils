<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/token-optimizer.utils" width="100%" />
</p>

<p align="center">
  <strong>Token optimization utilities: cleaning, strategies, telemetry</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

## Installation

```bash
npm install @simpill/token-optimizer.utils
```

---

## Quick Start

```typescript
import { cleanPrompt } from "@simpill/token-optimizer.utils";

const result = cleanPrompt({
  text: "  Hello   world  \n\n  tokens  ",
  options: { trim: true, collapseWhitespace: true, normalizeNewlines: true },
});
// result.output, result.appliedTransforms
```

---

## Features

| Feature | Description |
|---------|-------------|
| **cleanPrompt** | Trim, collapse whitespace, normalize newlines, jsonFlatten |
| **Compression strategies** | Passthrough, JSON, Markdown, XML, YAML, CSV, Toon, Tonl |
| **TokenOptimizer** | Optimize prompts with strategies and telemetry |
| **Telemetry** | createTelemetryStorage, createJsonTelemetryStorage (server) |
| **createTokenOptimizer** | Factory (server) |

---

## Import Paths

```typescript
import { ... } from "@simpill/token-optimizer.utils";         // Everything
import { ... } from "@simpill/token-optimizer.utils/server";  // Server (telemetry, factory)
import { ... } from "@simpill/token-optimizer.utils/client";  // Client (re-exports shared)
import { ... } from "@simpill/token-optimizer.utils/shared";  // Shared (cleaner, strategies, types)
```

---

## API Reference

- **cleanPrompt**({ text, options }) → CleanResult
- **CompressionStrategy**, **PassthroughStrategy**, **JsonCompressionStrategy**, etc.
- **TokenOptimizer** — optimizePrompt, dependencies
- **createTokenOptimizer** (server), **createTelemetryStorage** (server)
- **createDefaultValidatorRegistry**, **createDefaultTokenizerAdapter**
- Types: **CompressionType**, **CleanOptions**, **TokenOptimizationResult**, etc.

### What we don't provide

- **LLM tokenizer implementation** — Token counts and validation use a **tokenizer adapter**; you provide or register an implementation (e.g. tiktoken, custom). We do not bundle a specific tokenizer.
- **Built-in caching** — No cache layer for optimization results; cache at the call site if needed.
- **Additional compression formats** — Strategies cover JSON, Markdown, XML, YAML, CSV, Toon, Tonl, Passthrough; for others implement **CompressionStrategy** or use a separate library.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | cleanPrompt |

---

## Benchmark

Benchmark data (CSV, TXT, JSON, MD, XML, JSONL) at configurable sizes and a no-cache performance runner:

| Command | Description |
|---------|-------------|
| `npm run benchmark:data` | Generate data files in `data/benchmark/` (sizes: 1MB, 5MB, 20MB by default; set `BENCHMARK_SIZES_MB=1,5` to limit). |
| `npm run benchmark` | Regenerate data, then run 100 iterations per file × compression type; print a summary table and write a JSON report to `data/benchmark/reports/`. |

Override iterations with `BENCHMARK_ITERATIONS` (e.g. `BENCHMARK_ITERATIONS=10 npm run benchmark`). Reports include avg ms, p95 ms, tokens/bytes saved, and compression ratio per file and compression type.

---

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
