# LTR — Lumen Token Reducer

**By Lumen Industries.** A production-grade, **strictly lossless** token reducer
for LLM prompts and memory corpora. Where single-strategy re-encoders top out
on structured data and do *nothing* for prose, LTR stacks three orthogonal,
individually-lossless axes:

1. **Selection** — hybrid retrieval (dense bge-m3 embeddings + BM25 + Reciprocal
   Rank Fusion) selects whole verbatim segments relevant to a query. Kept text
   is never altered. Core/safety segments are pinned and never dropped.
2. **Exact-duplicate removal** — a byte/whitespace-normalized identical repeat
   carries zero information; later copies are dropped. Code is never deduped.
3. **Proven reversible re-encoding** — every structured (JSON) segment is tried
   against **five** encoders (TOON, TONL, CSV, YAML, JSON-min). Each candidate
   must pass a machine-checked round-trip proof — `decode(encode(x))` deep-equal
   `x` — before it can be adopted, and is adopted only if strictly cheaper than
   verbatim. Unproven or not-cheaper ⇒ verbatim. **Never-worse, by construction.**

No summarization. No paraphrase. No truncation. A transform that cannot be
proven lossless fails safe to verbatim — always.

## The lossless guarantee

Every delivered segment is exactly one of:
- verbatim source text (selection/dedup only choose *which* segments survive), or
- a re-encoding whose round-trip proof was machine-checked at encode time and
  can be independently re-audited at any time (`--verify`, `ltr.verify_result`).

The proof gate is not a policy — it is executed code. Encoders that mangle a
value (e.g. CSV turning the string `"007"` into the number `7`) *fail their own
proof* and are silently discarded for that segment.

## Usage

```bash
ltr reduce prompt.txt --report --verify                 # arbitrary-prompt mode
ltr reduce corpus.md --query "vault switchover" \
    --top-k 8 --budget 4000 --report                    # corpus mode (selection on)
ltr count prompt.txt                                    # authoritative token count
```

```python
from ltr import reduce_text, tok, make_selector
res = reduce_text(text, tok, select=make_selector(top_k=8),
                  query="...", budget=4000)
```

## Architecture

- `codec.mjs` — persistent Node sidecar daemon (JSONL over stdin/stdout):
  authoritative `gpt-tokenizer` counts + all encoder candidates + round-trip
  proofs. One process for the whole run; large corpora stay fast.
- `ltr/sidecar.py` — daemon lifecycle (spawn once, transparent restart).
- `ltr/segment.py` → `select.py` → `dedup.py` → `encode.py` → `assemble.py`
  — the pipeline. Assembly is **cache-aware**: pinned/stable segments are
  ordered first so LLM prompt-cache prefixes hit; a hard token budget drops
  lowest-relevance non-pinned segments only.
- `ltr/etcost.py` — **Effective-Tokens** cost metric (output 4×, cache-read
  0.1×, model multiplier), so reports state real cost, not just raw tokens.

## Credits and reuse

Built by **Lumen Industries**. The structured-encoding stage reuses the
encoder libraries popularized by Jay's `@simpill/token-optimizer`
(`@toon-format/toon`, `tonl`, plus `papaparse`/`js-yaml`) — reuse is bet-legal,
and there was no reason to rewrite what already worked. LTR wraps them in the
round-trip proof gate and adds the selection, dedup, segmentation, cache-aware
assembly, and ET-cost layers that a single-strategy encoder cannot provide.

## Tests

```bash
python3 -m pytest tests -q   # property tests: random JSON round-trips,
                             # never-worse, dedup, segmentation, budget, ET
```
