## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ffile.utils.svg)](https://www.npmjs.com/package/@simpill/file.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-file.utils)
</p>

**npm**
```bash
npm install @simpill/file.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-file.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-file.utils` or `npm link` from that directory.

---

## Usage

```ts
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
| **readFileJson** / **writeFileJson** | JSON with optional typing. Read strips UTF-8 BOM; parse errors include the file path (`JsonParseError`). Options: `validate`, `reviver`, `defaultValue` (read); `space`, `sortKeys`, `finalNewline`, `atomic` (write) |
| **writeFileAtomic** / **writeFileAtomicSync** | Crash-safe write: temp file + fsync + rename. Readers never see a partial file; a crash never corrupts the previous version. Preserves file mode; serializes concurrent writes per path |
| **pathExists** / **pathExistsSync** | Existence check that never throws |
| **readFileAsync** / **writeFileAsync** | Generic encoding; omit encoding for Buffer, or pass encoding for string |
| **Sync variants** | readFileUtf8Sync, writeFileUtf8Sync, readFileJsonSync, writeFileJsonSync, readFileSync, writeFileSync, ensureDirSync. Use **async** variants in hot paths (e.g. request handlers) to avoid blocking the event loop. |
| **Path helpers** | basename, dirname, extname, isAbsolutePath, joinPath, normalizePath, resolvePath (server) |
| **Traversal guards** | `isPathUnderRoot` / `resolvePathUnderRoot` (lexical) and `isPathUnderRootReal` / `resolvePathUnderRootReal` (+Sync) which also resolve symlinks — a symlink inside the root pointing outside it is rejected. Use the `Real` variants for untrusted input |
| **ensureDir** | Recursive directory creation; write helpers call it for the parent of the file path |
| **Server only** | Node.js file system access |

---

## Import Paths

```ts
import { ... } from "@simpill/file.utils";         // Everything
import { ... } from "@simpill/file.utils/server";  // Node.js file I/O
import { ... } from "@simpill/file.utils/client"; // Empty (no fs in browser)
import { ... } from "@simpill/file.utils/shared"; // Shared only
```

---

## API Reference

- **readFileUtf8**(path) → Promise&lt;string&gt; — **readFileUtf8Sync** for sync.
- **writeFileUtf8**(path, content) → Promise&lt;void&gt; — **writeFileUtf8Sync** for sync. Creates parent directory if needed.
- **readFileJson**&lt;T&gt;(path, options?) → Promise&lt;T&gt; — **readFileJsonSync** for sync. **T** is not validated unless **options.validate** is provided (e.g. `(d) => configSchema.parse(d)`). No Zod dependency; pass your schema’s parse in **validate**.
- **writeFileJson**&lt;T&gt;(path, data, options?) → Promise&lt;void&gt; — **writeFileJsonSync** for sync.
- **readFileAsync**(path, encoding?) → Promise&lt;string | Buffer&gt; — **Encoding:** one argument → UTF-8 string. Two arguments: `encoding` as `FileEncoding` → string; `encoding` as `undefined` → Buffer. Use **readFileSync** for the sync variant.
- **writeFileAsync**(path, data, encoding?) → Promise&lt;void&gt; — **writeFileSync** for sync. **Parent directories** are created automatically (via `ensureDir` on the path’s directory) before writing.
- **writeFileAtomic**(path, data, options?) → Promise&lt;void&gt; — **writeFileAtomicSync** for sync. Crash-safe temp-file + fsync + rename write. Options: `encoding`, `fsync` (default true), `mode`.
- **pathExists**(path) → Promise&lt;boolean&gt; — **pathExistsSync** for sync. Never throws.
- **ensureDir**(path) → Promise&lt;void&gt; — **ensureDirSync** for sync. Recursive directory creation.
- **Path helpers (server):** **basename**, **dirname**, **extname**, **isAbsolutePath**, **joinPath**, **normalizePath**, **resolvePath** — same semantics as Node `path` module.
- **Traversal guards:** **isPathUnderRoot** / **resolvePathUnderRoot** (lexical — symlinks are NOT resolved) and **isPathUnderRootReal** / **resolvePathUnderRootReal** (+**Sync** variants) which additionally resolve symlinks and verify the real target stays under the real root. Non-existent trailing segments are allowed, so the `Real` guards also work for files about to be created.
- **JsonParseError** — thrown by readFileJson/readFileJsonSync on invalid JSON; extends `SyntaxError`, carries `path` and `cause`.
- **FileEncoding** (includes `base64url`, `utf16le`), **ReadFileJsonOptions**, **WriteFileJsonOptions**, **WriteFileAtomicOptions**

### Sync vs async

Use async variants (`readFileUtf8`, `readFileJson`, etc.) in normal application code to avoid blocking the event loop. Use sync variants (`readFileUtf8Sync`, etc.) in build scripts or one-off CLI code where async is not needed. All write helpers create parent directories before writing; missing or permission errors throw.

### Atomic writes

`writeFileAtomic(path, data, options?)` writes to a unique temp file **in the same directory** (rename is only atomic within a filesystem), fsyncs it (`fsync: false` to skip), then renames over the target. A crash at any point leaves either the complete old file or the complete new file — never a truncated hybrid. The existing file's mode is preserved (`mode` to override). Concurrent writes to the same path are serialized in call order; different paths run in parallel. `writeFileJson(path, data, { atomic: true })` routes through it.

### What we don’t provide

- **fs-extra-style helpers** — No copy, move, remove, or symlink helpers. Use `fs.promises` or the `fs-extra` package for those.
- **Streaming** — No stream helpers; use `fs.createReadStream` / `createWriteStream` or a streaming library.
- **Glob / traverse** — No glob or directory-walk APIs. Use `fast-glob`, `globby`, or `fs.readdir` with recursion.
- **JSON validation** — `readFileJson` uses `JSON.parse` only by default. Pass **options.validate** (e.g. `(d) => myZodSchema.parse(d)`) for runtime validation without this package depending on Zod.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | readFileUtf8, writeFileUtf8, readFileJson, writeFileJson, ensureDir |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
