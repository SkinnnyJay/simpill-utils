<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/string.utils" width="100%" />
</p>

<p align="center">
  <strong>String utilities: formatting, casing, trim, slugify</strong>
</p>

<p align="center">
  Slugify, casing, trim, and format strings with consistent, typed helpers.
</p>

**Features:** Type-safe · Node & Edge · Tree-shakeable

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** String formatting, casing (camel, snake, kebab), trimming, or rich-text building. Use for consistent string handling and smaller bundles than a full i18n/format library.

---

## Installation

```bash
npm install @simpill/string.utils
```

---

## Quick Start

```typescript
import {
  StringBuilder,
  StringTemplate,
  formatRichText,
  formatString,
  slugify,
  toCamelCase,
  truncate,
  truncateWords,
  wrapText,
} from "@simpill/string.utils";

const builder = new StringBuilder()
  .append("Hello ")
  .appendFormat("{name}", { name: "Ada" })
  .appendLine("!");

const template = new StringTemplate("User: {0}");
const formatted = formatString("User: {0}", ["Ada"]);
const templated = template.format(["Ada"]);
const rich = formatRichText("Success", { bold: true, color: "green" }, "ansi");
const camel = toCamelCase("hello-world");
const short = truncate("hello world", 8);
const words = truncateWords("one two three", 2);
const wrapped = wrapText("one two three four", 7);
const slug = slugify("Creme brulee");
```

---

## Features

| Feature | Description |
|---------|-------------|
| **StringBuilder** | append, appendLine, appendFormat, appendAll |
| **StringTemplate** | format(values) with placeholder support |
| **RichTextBuilder** | build styled text (ansi/html/plain) |
| **formatString** | Format with {0}, {name}, array or record values |
| **formatRichText** | Styled output (e.g. ansi) with bold, color |
| **Casing** | toCamelCase, toSnakeCase, etc. |
| **truncate** / **truncateWords** | Truncate by length or word count |
| **wrapText** | Wrap to line length |
| **slugify** | URL-friendly slugs |

---

## Import Paths

```typescript
import { ... } from "@simpill/string.utils";         // Everything
import { ... } from "@simpill/string.utils/client";  // Client
import { ... } from "@simpill/string.utils/server";  // Server
import { ... } from "@simpill/string.utils/shared";  // Shared only
```

---

## API Reference

- **StringBuilder** — append, appendLine, appendFormat, appendAll, toString
- **StringTemplate** — format(values, options?) — reuse one template string
- **RichTextBuilder** — append, appendLine, toAnsi, toHtml, toPlain
- **formatString**(template, values, options?) — placeholders `{0}` or `{name}`; **not** sprintf-style. Use `{{`/`}}` for literal braces. Options: `onMissing` (ignore|empty|throw), `stringify`.
- **formatRichText**(text, style, format?) — RichStyle, "ansi"; use toPlain() when you need length or stripAnsi.
- **toCamelCase**, **toSnakeCase**, and other casing helpers — **not locale-aware** (use Intl for Turkish etc.).
- **truncate**(str, maxLen, options?), **truncateWords**(str, maxWords) — by code units; not grapheme-safe for emoji.
- **wrapText**(str, lineLength, options?) — WrapOptions: breakLongWords, newline
- **slugify**(str, options?) — **SlugifyOptions**: `separator` (default `"-"`), `lower` (default true)
- **escapeHtml** / **unescapeHtml** — `&<>"'` ↔ entities
- **stripAnsi**(str) — removes SGR (color/style) codes; not full CSI (e.g. cursor) coverage

### Template vs formatString

Use **StringTemplate** when you have one template and format it many times (e.g. `new StringTemplate("Hello, {0}").format([name])`). Use **formatString** for one-off formatting with the same `{0}`/`{name}` placeholder rules; both accept array or record values.

### Tagged template helpers

This package does not provide tagged-template helpers (e.g. `html\`...\`` or `sql\`...\``). Use native template literals for simple cases, or a dedicated library (e.g. for SQL escaping, HTML sanitization) when you need safe interpolation.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | StringBuilder, formatString, toCamelCase, truncate, truncateWords, slugify |

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
