// LTR codec sidecar — Lumen Industries.
// Persistent daemon: authoritative gpt-tokenizer counts + lossless-PROVEN
// structured re-encoding. Reuses Jay's encoder libraries (bet-legal) but every
// candidate must pass decode(encode(x)) deep-equal x before it is trusted.
// Any proof failure => candidate discarded => caller keeps verbatim.
import { createInterface } from "node:readline";
import { isDeepStrictEqual } from "node:util";
import { encode as toonEnc, decode as toonDec } from "@toon-format/toon";
import { encodeSmart as tonlEnc, decodeTONL as tonlDec } from "tonl";
import Papa from "papaparse";
import * as yaml from "js-yaml";
import { encode as gptEnc } from "gpt-tokenizer";

const tok = (s) => gptEnc(s).length;

// ---- lossless encoder candidates -------------------------------------------
// Each returns {name, text} or null. Proof is applied uniformly afterwards.
const isFlatUniformArray = (v) =>
  Array.isArray(v) && v.length > 0 &&
  v.every((r) => r !== null && typeof r === "object" && !Array.isArray(r) &&
    Object.values(r).every((x) => x === null || ["string", "number", "boolean"].includes(typeof x)));

const CANDIDATES = {
  "json-min": {
    enc: (v) => JSON.stringify(v),
    dec: (s) => JSON.parse(s),
  },
  toon: {
    enc: (v) => toonEnc(v, { indent: 2, delimiter: ",", keyFolding: "safe" }),
    dec: (s) => toonDec(s),
  },
  tonl: {
    enc: (v) => tonlEnc(v),
    dec: (s) => tonlDec(s),
  },
  csv: {
    enc: (v) => {
      if (!isFlatUniformArray(v)) throw new Error("csv: not flat uniform array");
      return Papa.unparse(v, { newline: "\n" });
    },
    dec: (s) => {
      const r = Papa.parse(s, { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (r.errors && r.errors.length) throw new Error("csv parse errors");
      return r.data;
    },
  },
  yaml: {
    enc: (v) => yaml.dump(v, { flowLevel: 2, noRefs: true }),
    dec: (s) => yaml.load(s),
  },
};

// ---- ops --------------------------------------------------------------------
function opCount(payload) {
  return { ok: true, tokens: tok(payload.text) };
}

// Try every candidate encoder; keep only those with a MACHINE-CHECKED
// round-trip proof (deep strict equal). Return them sorted by token count.
function opEncode(payload) {
  let value;
  try { value = JSON.parse(payload.json); }
  catch { return { ok: false, reason: "not-json" }; }
  const proven = [];
  for (const [name, c] of Object.entries(CANDIDATES)) {
    let text;
    try { text = c.enc(value); } catch { continue; }
    if (typeof text !== "string" || !text.length) continue;
    let lossless = false;
    try { lossless = isDeepStrictEqual(c.dec(text), value); } catch { lossless = false; }
    if (!lossless) continue; // proof failed -> discard, never adopt
    proven.push({ name, text, tokens: tok(text) });
  }
  proven.sort((a, b) => a.tokens - b.tokens);
  return { ok: true, candidates: proven };
}

// Re-verify a previously adopted encoding (used by the test suite / verifier).
function opVerify(payload) {
  let value;
  try { value = JSON.parse(payload.json); }
  catch { return { ok: false, reason: "not-json" }; }
  const c = CANDIDATES[payload.encoder];
  if (!c) return { ok: false, reason: "unknown-encoder" };
  let lossless = false;
  try { lossless = isDeepStrictEqual(c.dec(payload.text), value); } catch { lossless = false; }
  return { ok: true, lossless };
}

const OPS = { count: opCount, encode: opEncode, verify: opVerify };

function handle(line) {
  let req;
  try { req = JSON.parse(line); }
  catch { return { ok: false, reason: "bad-request" }; }
  const fn = OPS[req.op];
  if (!fn) return { ok: false, reason: "unknown-op" };
  try { return { id: req.id, ...fn(req) }; }
  catch (e) { return { id: req.id, ok: false, reason: String(e) }; }
}

// ---- entrypoints -------------------------------------------------------------
const mode = process.argv[2];

if (mode === "daemon") {
  // Persistent JSONL loop: one request per line on stdin, one response per line.
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    process.stdout.write(JSON.stringify(handle(line)) + "\n");
  });
  rl.on("close", () => process.exit(0));
} else if (mode === "count") {
  // one-shot (kept for compatibility / debugging)
  const { readFileSync } = await import("node:fs");
  process.stdout.write(String(tok(readFileSync(0, "utf8"))));
} else if (mode === "encode") {
  const { readFileSync } = await import("node:fs");
  process.stdout.write(JSON.stringify(opEncode({ json: readFileSync(0, "utf8") })));
} else {
  process.stderr.write("usage: node codec.mjs daemon|count|encode\n");
  process.exit(1);
}
