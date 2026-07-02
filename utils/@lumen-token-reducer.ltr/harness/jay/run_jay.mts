// Head-to-head driver for Jay's @simpill/token-optimizer (run via tsx).
// Runs his REAL TokenOptimizer.optimize() across all his strategies, scores
// with the same gpt-tokenizer, picks his best result. No home-field advantage:
// Lumen Industries harness, Jay's own code path.
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { encode as gptEnc } from "gpt-tokenizer";
import { TokenOptimizer } from "./src/shared/tokenOptimizer";
import { createDefaultValidatorRegistry } from "./src/shared/validatorRegistry";
import { CompressionTypeEnum } from "./src/shared/types";
import { ToonCompressionStrategy } from "./src/shared/strategies/toon-strategy";
import { TonlCompressionStrategy } from "./src/shared/strategies/tonl-strategy";
import { JsonCompressionStrategy } from "./src/shared/strategies/json-strategy";
import { YamlCompressionStrategy } from "./src/shared/strategies/yaml-strategy";
import { CsvCompressionStrategy } from "./src/shared/strategies/csv-strategy";
import { MarkdownCompressionStrategy } from "./src/shared/strategies/markdown-strategy";
import { XmlCompressionStrategy } from "./src/shared/strategies/xml-strategy";
import { PassthroughStrategy } from "./src/shared/strategies/passthrough-strategy";

const tok = (s: string) => gptEnc(s).length;

const tokenizer = {
  estimate: (input: string) => ({
    tokenCount: tok(input),
    charCount: input.length,
    byteSize: new TextEncoder().encode(input).length,
  }),
};
const telemetryStorage = {
  persistSnapshot: async () => {},
  fetchRecent: async () => [],
  purge: async () => {},
};

function buildStrategies() {
  const m = new Map<any, any>();
  m.set(CompressionTypeEnum.TOON, new ToonCompressionStrategy());
  m.set(CompressionTypeEnum.TONL, new TonlCompressionStrategy());
  m.set(CompressionTypeEnum.JSON, new JsonCompressionStrategy());
  m.set(CompressionTypeEnum.YAML, new YamlCompressionStrategy());
  m.set(CompressionTypeEnum.CSV, new CsvCompressionStrategy());
  m.set(CompressionTypeEnum.MARKDOWN, new MarkdownCompressionStrategy());
  m.set(CompressionTypeEnum.XML, new XmlCompressionStrategy());
  return m;
}

// Fidelity: structured inputs must decode back to the original parsed value;
// non-structured must be verbatim (whitespace-normalized allowed — generous).
async function fidelity(original: string, result: string, type: string): Promise<boolean> {
  let parsed: any = null;
  try { parsed = JSON.parse(original); } catch { parsed = null; }
  if (parsed !== null) {
    try {
      if (type === "TOON") {
        const toon = await import("@toon-format/toon");
        return isDeepStrictEqual(toon.decode(result), parsed);
      }
      if (type === "TONL") {
        const tonl = await import("tonl");
        return isDeepStrictEqual(tonl.decodeTONL(result), parsed);
      }
      if (type === "JSON") return isDeepStrictEqual(JSON.parse(result), parsed);
      if (type === "YAML") {
        const yaml = await import("js-yaml");
        return isDeepStrictEqual(yaml.load(result), parsed);
      }
      if (type === "CSV") {
        const Papa = (await import("papaparse")).default;
        const r = Papa.parse(result, { header: true, dynamicTyping: true, skipEmptyLines: true });
        return isDeepStrictEqual(r.data, parsed);
      }
      return result === original; // MARKDOWN/XML of JSON: no decoder -> verbatim only
    } catch { return false; }
  }
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(result) === norm(original);
}

async function main() {
  // Jay's logger writes to stdout; keep our stdout pure JSON.
  console.log = (...a: any[]) => console.error(...a);
  console.info = (...a: any[]) => console.error(...a);
  console.warn = (...a: any[]) => console.error(...a);
  console.debug = (...a: any[]) => console.error(...a);
  const [file, budgetArg] = process.argv.slice(2);
  const text = readFileSync(file, "utf8");
  const budget = budgetArg ? parseInt(budgetArg, 10) : null;
  const optimizer = new TokenOptimizer({
    tokenizer, telemetryStorage,
    strategies: buildStrategies(),
    validatorRegistry: createDefaultValidatorRegistry(),
  });

  let best: any = null;
  const tried: any[] = [];
  for (const type of Object.values(CompressionTypeEnum)) {
    try {
      const r = await optimizer.optimize({ prompt: text, compressionType: type as any });
      const out = (r as any).optimizedPrompt ?? "";
      if (!out || !out.trim()) continue; // degenerate empty output (e.g. XML on JSON) — excluded, generous to Jay
      const t = tok(out);
      const fid = await fidelity(text, out, type as string);
      tried.push({ type, tokens: t, fidelity: fid });
      if (!best || t < best.tokens) best = { type, tokens: t, output: out, fidelity: fid };
    } catch { /* strategy inapplicable */ }
  }
  if (!best) best = { type: "PASSTHROUGH", tokens: tok(text), output: text, fidelity: true };

  // Budget: his tool has no selection axis — the only mechanism it has to
  // meet a hard token cap is truncation of its best output.
  let delivered = best.output;
  let truncated = false;
  if (budget && best.tokens > budget) {
    const toks = gptEnc(delivered);
    const { decode } = await import("gpt-tokenizer");
    delivered = decode(toks.slice(0, budget));
    truncated = true;
  }

  process.stdout.write(JSON.stringify({
    tool: "@simpill/token-optimizer",
    tokens_before: tok(text),
    best_type: best.type,
    tokens_after_full: best.tokens,
    tokens_delivered: tok(delivered),
    fidelity: best.fidelity && !truncated,
    truncated,
    tried,
    output: delivered,
  }));
}
main();
