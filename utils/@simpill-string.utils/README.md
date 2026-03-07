## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fstring.utils.svg)](https://www.npmjs.com/package/@simpill/string.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-string.utils)
</p>

**npm**
```bash
npm install @simpill/string.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-string.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-string.utils` or `npm link` from that directory.

---

## Usage

```ts
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

```ts
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

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
