## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ftoken-optimizer.utils.svg)](https://www.npmjs.com/package/@simpill/token-optimizer.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-token-optimizer.utils)
</p>

**npm**
```bash
npm install @simpill/token-optimizer.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-token-optimizer.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-token-optimizer.utils` or `npm link` from that directory.

---

## Usage

```ts
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

```ts
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

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
