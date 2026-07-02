"""LTR orchestrator (Lumen Industries).

Strictly lossless pipeline: segment -> [select] -> dedup -> best-proven-encode
-> cache-aware assemble. Every stage is one of the three permitted transform
classes (selection of verbatim segments / exact-dup removal / PROVEN
reversible re-encoding). Anything unprovable stays verbatim. Never-worse."""
from .segment import segment
from .dedup import dedup
from .encode import encode_segment, verify_encoding
from .assemble import assemble
from .etcost import et_report
from .select import is_pinned


def reduce_text(text, tok, select=None, query=None, budget=None, model="sonnet"):
    before = tok(text)
    segs = segment(text)
    n_seg = len(segs)
    if select is not None and query is not None:
        segs = select(segs, query)
    selected = len(segs)
    segs, removed = dedup(segs)
    out, encoded = [], 0
    for s in segs:
        ns, changed = encode_segment(s, tok)
        if changed:
            encoded += 1
        out.append(ns)
    reduced, dropped = assemble(out, tok, budget=budget)
    after = tok(reduced)
    pinned_tok = sum(tok(s["text"]) for s in out if is_pinned(s))
    return {
        "output": reduced,
        "tokens_before": before,
        "tokens_after": after,
        "reduction_pct": round(100 * (1 - after / max(before, 1)), 1),
        "segments_in": n_seg,
        "segments_selected": selected,
        "segments_out": len(out) - dropped,
        "deduped": removed,
        "encoded": encoded,
        "budget_dropped": dropped,
        "et": et_report(before, after, cached_after=min(pinned_tok, after), model=model),
        "_segments": out,
    }


def verify_result(text, result):
    """Independent lossless audit of a reduce_text result:
    - every delivered non-encoded segment must appear verbatim in the source,
    - every adopted encoding must re-prove its round-trip via the daemon.
    Returns (ok, problems)."""
    problems = []
    for s in result["_segments"]:
        if "encoded" in s:
            if not verify_encoding(s):
                problems.append(f"encoding failed re-proof: {s['text'][:60]!r}")
        else:
            if s["text"] not in text:
                problems.append(f"delivered text not verbatim in source: {s['text'][:60]!r}")
    return (not problems), problems
