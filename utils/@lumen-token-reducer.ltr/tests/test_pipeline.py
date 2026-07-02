"""Dedup correctness, segmentation, selection, budget/assembly, ET metric."""
import json

from ltr import reduce_text, tok, segment, dedup, make_selector
from ltr.assemble import assemble
from ltr.etcost import effective_tokens, et_report


def test_segmentation_types():
    text = "some prose here\n\n```json\n[1,2,3]\n```\n\n```python\nprint(1)\n```\n\n{\"k\": 1}"
    kinds = [s["kind"] for s in segment(text)]
    assert kinds == ["prose", "json", "code", "json"]


def test_dedup_exact_only():
    segs = segment("alpha beta\n\nalpha  beta\n\nalpha beta gamma")
    out, removed = dedup(segs)
    assert removed == 1  # whitespace-normalized identical repeat removed
    assert len(out) == 2
    assert out[0]["text"] == "alpha beta"  # first occurrence kept verbatim


def test_dedup_never_touches_code():
    text = "```python\nx = 1\n```\n\n```python\nx = 1\n```"
    out, removed = dedup(segment(text))
    assert removed == 0 and len(out) == 2


def test_selection_keeps_pinned_and_relevant():
    docs = "\n\n".join([
        "safety rule: NEVER reboot without permission #CORE",
        "the printer lives on apep",
        "plex serves media from thoth",
        "vault switchover: disarm the monitor first",
    ])
    sel = make_selector(top_k=1)
    res = reduce_text(docs, tok, select=sel, query="vault switchover steps")
    assert "vault switchover" in res["output"]
    assert "NEVER reboot" in res["output"]  # pinned survives regardless of query


def test_budget_drops_nonpinned_only():
    segs = [
        {"kind": "prose", "text": "MUST keep this safety line " + "x" * 200, "pinned": True},
        {"kind": "prose", "text": "filler one " + "a" * 400, "sel_rank": 5},
        {"kind": "prose", "text": "filler two " + "b" * 400, "sel_rank": 6},
    ]
    out, dropped = assemble(segs, tok, budget=80)
    assert "MUST keep" in out          # pinned always included, even over budget
    assert dropped >= 1


def test_cache_aware_pinned_prefix_order():
    segs = [
        {"kind": "prose", "text": "variable tail"},
        {"kind": "prose", "text": "stable core #CORE"},
    ]
    out, _ = assemble(segs, tok)
    assert out.index("stable core") < out.index("variable tail")


def test_et_metric():
    assert effective_tokens(input_tokens=100) == 100
    assert effective_tokens(output_tokens=100) == 400
    assert effective_tokens(cache_read_tokens=100) == 10
    assert effective_tokens(input_tokens=100, model="opus") == 500
    r = et_report(1000, 400, cached_after=200)
    assert r["et_reduction_cold_pct"] == 60.0
    assert r["et_after_warm"] == 220.0  # 200 fresh + 200*0.1


def test_reduce_reports_consistent_counts():
    prompt = "p1\n\np1\n\n```json\n" + json.dumps([{"a": i} for i in range(10)]) + "\n```"
    res = reduce_text(prompt, tok)
    assert res["deduped"] == 1
    assert res["tokens_after"] == tok(res["output"])
    assert res["tokens_after"] < res["tokens_before"]
