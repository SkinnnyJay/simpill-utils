<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/file.utils" width="100%" />
</p>

<p align="center">
  <strong>Typed file I/O: readFileUtf8, readFileJson, writeFile, ensureDir (Node.js)</strong>
</p>

<p align="center">
  Read/write UTF-8 and JSON files and ensure directories (Node) with typed APIs.
</p>

**Features:** Type-safe · Node only · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** Read/write UTF-8 or JSON files, or ensure directories exist, in Node.js. Use for simple file I/O without extra dependencies (server-only).

---

## Installation

```bash
npm install @simpill/file.utils
```

---

## Quick Start

```typescript
import {
  readFileUtf8,
  writeFileUtf8,
  readFileJson,
  writeFileJson,
  ensureDir,
} from "@simpill/file.utils/server";

await ensureDir("./data");
await writeFileUtf8("./data/hello.txt", "Hello");
const text = await readFileUtf8("./data/hello.txt");
await writeFileJson("./data/config.json", { port: 3000 });
const config = await readFileJson<{ port: number }>("./data/config.json");
```

---

## Features

Read and write APIs live in the same module; if the file grows, consider splitting into read vs write. For now:

| Feature | Description |
|---------|-------------|
| **readFileUtf8** / **writeFileUtf8** | UTF-8 string read/write |
| **readFileJson** / **writeFileJson** | JSON with optional typing |
| **readFileAsync** / **writeFileAsync** | Generic encoding; omit encoding for Buffer, or pass encoding for string |
| **Sync variants** | readFileUtf8Sync, writeFileUtf8Sync, readFileJsonSync, writeFileJsonSync, readFileSync, writeFileSync, ensureDirSync. Use **async** variants in hot paths (e.g. request handlers) to avoid blocking the event loop. |
| **Path helpers** | basename, dirname, extname, isAbsolutePath, joinPath, normalizePath, resolvePath (server) |
| **ensureDir** | Recursive directory creation; write helpers call it for the parent of the file path |
| **Server only** | Node.js file system access |

---

## Import Paths

```typescript
import { ... } from "@simpill/file.utils";         // Everything
import { ... } from "@simpill/file.utils/server";  // Node.js file I/O
import { ... } from "@simpill/file.utils/client"; // Empty (no fs in browser)
import { ... } from "@simpill/file.utils/shared"; // Shared only
```

---

## API Reference

- **readFileUtf8**(path) → Promise&lt;string&gt; — **readFileUtf8Sync** for sync.
- **writeFileUtf8**(path, content) → Promise&lt;void&gt; — **writeFileUtf8Sync** for sync. Creates parent directory if needed.
- **readFileJson**&lt;T&gt;(path) → Promise&lt;T&gt; — **readFileJsonSync** for sync. **T is not validated at runtime**; only a type assertion. Use Zod (or similar) after reading if you need a guaranteed shape.
- **writeFileJson**&lt;T&gt;(path, data, options?) → Promise&lt;void&gt; — **writeFileJsonSync** for sync.
- **readFileAsync**(path, encoding?) → Promise&lt;string | Buffer&gt; — **Encoding:** one argument → UTF-8 string. Two arguments: `encoding` as `FileEncoding` → string; `encoding` as `undefined` → Buffer. Use **readFileSync** for the sync variant.
- **writeFileAsync**(path, data, encoding?) → Promise&lt;void&gt; — **writeFileSync** for sync. **Parent directories** are created automatically (via `ensureDir` on the path’s directory) before writing.
- **ensureDir**(path) → Promise&lt;void&gt; — **ensureDirSync** for sync. Recursive directory creation.
- **Path helpers (server):** **basename**, **dirname**, **extname**, **isAbsolutePath**, **joinPath**, **normalizePath**, **resolvePath** — same semantics as Node `path` module.
- **FileEncoding**, **WriteFileJsonOptions**

### Sync vs async

Use async variants (`readFileUtf8`, `readFileJson`, etc.) in normal application code to avoid blocking the event loop. Use sync variants (`readFileUtf8Sync`, etc.) in build scripts or one-off CLI code where async is not needed. All write helpers create parent directories before writing; missing or permission errors throw.

### What we don’t provide

- **fs-extra-style helpers** — No copy, move, remove, or symlink helpers. Use `fs.promises` or the `fs-extra` package for those.
- **Atomic write** — Writes are direct; no write-to-temp-then-rename. For atomic updates, write to a temp path then rename with `fs.rename` (or use a library).
- **Streaming** — No stream helpers; use `fs.createReadStream` / `createWriteStream` or a streaming library.
- **Glob / traverse** — No glob or directory-walk APIs. Use `fast-glob`, `globby`, or `fs.readdir` with recursion.
- **JSON validation** — `readFileJson` uses `JSON.parse` only; no schema validation. Validate with Zod (or similar) after reading if you need a schema.
- **Stable stringify** — `writeFileJson` uses `JSON.stringify`; key order is not guaranteed. For deterministic output, use a custom replacer or sort keys before stringifying.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | readFileUtf8, writeFileUtf8, readFileJson, writeFileJson, ensureDir |

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
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
