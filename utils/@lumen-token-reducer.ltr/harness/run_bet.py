#!/usr/bin/env python3
"""THE SCOREBOARD — LTR (Lumen Industries) vs Jay's @simpill/token-optimizer.

Same inputs, same tokenizer (gpt-tokenizer via the LTR daemon for both sides'
scoring), no home-field advantage: Jay's numbers come from his own
TokenOptimizer code path (harness/jay/run_jay.mts).

Scenarios:
  S1 pure-structured : fleet_roster.json, no query      -> reduction + fidelity
  S2 arbitrary prompt: mixed_prompt.md,  no query       -> reduction + fidelity
  S3 retrieval       : memory_corpus.md, 6 labeled queries, shared 400-token
                       budget -> reduction + HIT-RATE + fidelity + ET

Metrics: token reduction %, retrieval hit-rate (did every must-survive fact
survive delivery), lossless-fidelity (round-trip/verbatim), ET-weighted cost.
Outputs: report.json + REPORT.md.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, "/home/lumen/bets/ltr")
from ltr import reduce_text, tok, make_selector, verify_result  # noqa
from ltr.etcost import effective_tokens  # noqa

CORPUS = os.path.join(HERE, "corpus")
BUDGET = 400
TOP_K = 3


def run_jay(path, budget=None):
    cmd = ["npx", "tsx", os.path.join(HERE, "jay", "run_jay.mts"), path]
    if budget:
        cmd.append(str(budget))
    p = subprocess.run(cmd, cwd=os.path.join(HERE, "jay"),
                       capture_output=True, text=True, timeout=600)
    return json.loads(p.stdout)


def run_ltr(path, query=None, budget=None):
    text = open(path, encoding="utf-8").read()
    sel = make_selector(top_k=TOP_K) if query else None
    res = reduce_text(text, tok, select=sel, query=query, budget=budget)
    ok, problems = verify_result(text, res)
    return text, res, ok, problems


def hits(output, must):
    return sum(1 for m in must if m in output), len(must)

def main():
    report = {"tool_a": "LTR (Lumen Industries)", "tool_b": "@simpill/token-optimizer",
              "tokenizer": "gpt-tokenizer", "budget_s3": BUDGET, "scenarios": {}}

    # ---- S1: pure structured ------------------------------------------------
    p = os.path.join(CORPUS, "fleet_roster.json")
    text, res, ok, _ = run_ltr(p)
    jay = run_jay(p)
    report["scenarios"]["S1_pure_structured"] = {
        "tokens_before": res["tokens_before"],
        "ltr": {"tokens_after": res["tokens_after"], "reduction_pct": res["reduction_pct"],
                "fidelity": ok, "encoder": (res["_segments"][0].get("encoded") if res["_segments"] else None)},
        "jay": {"tokens_after": jay["tokens_delivered"],
                "reduction_pct": round(100 * (1 - jay["tokens_delivered"] / jay["tokens_before"]), 1),
                "fidelity": jay["fidelity"], "encoder": jay["best_type"]},
    }

    # ---- S2: arbitrary mixed prompt -----------------------------------------
    p = os.path.join(CORPUS, "mixed_prompt.md")
    text, res, ok, _ = run_ltr(p)
    jay = run_jay(p)
    report["scenarios"]["S2_arbitrary_prompt"] = {
        "tokens_before": res["tokens_before"],
        "ltr": {"tokens_after": res["tokens_after"], "reduction_pct": res["reduction_pct"],
                "fidelity": ok, "deduped": res["deduped"], "encoded": res["encoded"]},
        "jay": {"tokens_after": jay["tokens_delivered"],
                "reduction_pct": round(100 * (1 - jay["tokens_delivered"] / jay["tokens_before"]), 1),
                "fidelity": jay["fidelity"], "encoder": jay["best_type"]},
    }

    # ---- S3: retrieval under a shared budget --------------------------------
    p = os.path.join(CORPUS, "memory_corpus.md")
    queries = json.load(open(os.path.join(CORPUS, "queries.json")))
    jay = run_jay(p, budget=BUDGET)  # query-independent: his tool cannot select
    s3 = {"tokens_before": tok(open(p).read()), "queries": []}
    lt_hit = lt_red = jy_hit = 0
    lt_fid_all = True
    for q in queries:
        text, res, ok, problems = run_ltr(p, query=q["query"], budget=BUDGET)
        lh, tot = hits(res["output"], q["must_survive"])
        jh, _ = hits(jay["output"], q["must_survive"])
        lt_hit += lh / tot
        jy_hit += jh / tot
        lt_red += res["reduction_pct"]
        lt_fid_all = lt_fid_all and ok
        s3["queries"].append({
            "query": q["query"],
            "ltr": {"tokens_after": res["tokens_after"], "reduction_pct": res["reduction_pct"],
                    "hits": f"{lh}/{tot}", "fidelity": ok},
            "jay": {"tokens_after": jay["tokens_delivered"], "hits": f"{jh}/{tot}",
                    "truncated": jay["truncated"], "fidelity": jay["fidelity"]},
        })
    n = len(queries)
    s3["summary"] = {
        "ltr": {"avg_reduction_pct": round(lt_red / n, 1), "hit_rate_pct": round(100 * lt_hit / n, 1),
                "fidelity": lt_fid_all,
                "avg_et_cost": round(sum(effective_tokens(input_tokens=qq["ltr"]["tokens_after"]) for qq in s3["queries"]) / n, 1)},
        "jay": {"avg_reduction_pct": round(100 * (1 - jay["tokens_delivered"] / s3["tokens_before"]), 1),
                "hit_rate_pct": round(100 * jy_hit / n, 1),
                "fidelity": jay["fidelity"],
                "avg_et_cost": round(effective_tokens(input_tokens=jay["tokens_delivered"]), 1)},
    }
    report["scenarios"]["S3_retrieval_budget"] = s3

    with open(os.path.join(HERE, "report.json"), "w") as f:
        f.write(json.dumps(report, indent=2))
    write_md(report)
    print(json.dumps(report["scenarios"]["S3_retrieval_budget"]["summary"], indent=2))
    print("wrote report.json + REPORT.md")

def write_md(r):
    s1 = r["scenarios"]["S1_pure_structured"]
    s2 = r["scenarios"]["S2_arbitrary_prompt"]
    s3 = r["scenarios"]["S3_retrieval_budget"]
    L = []
    L.append("# THE SCOREBOARD — LTR (Lumen Industries) vs @simpill/token-optimizer\n")
    L.append(f"Same tokenizer (`gpt-tokenizer`), same fixed corpus, Jay's own code path for Jay's numbers. Shared S3 budget: **{r['budget_s3']} tokens**.\n")
    L.append("## S1 — Pure structured (his best case)\n")
    L.append("| tool | tokens | reduction | fidelity | encoder |\n|---|---|---|---|---|")
    L.append(f"| LTR | {s1['ltr']['tokens_after']} | **{s1['ltr']['reduction_pct']}%** | {'100%' if s1['ltr']['fidelity'] else 'FAIL'} | {s1['ltr']['encoder']} |")
    L.append(f"| Jay | {s1['jay']['tokens_after']} | {s1['jay']['reduction_pct']}% | {'100%' if s1['jay']['fidelity'] else 'FAIL'} | {s1['jay']['encoder']} |")
    L.append(f"\n(before: {s1['tokens_before']} tokens)\n")
    L.append("## S2 — Arbitrary mixed prompt (prose + JSON + duplicates)\n")
    L.append("| tool | tokens | reduction | fidelity |\n|---|---|---|---|")
    L.append(f"| LTR | {s2['ltr']['tokens_after']} | **{s2['ltr']['reduction_pct']}%** | {'100%' if s2['ltr']['fidelity'] else 'FAIL'} |")
    L.append(f"| Jay | {s2['jay']['tokens_after']} | {s2['jay']['reduction_pct']}% | {'100%' if s2['jay']['fidelity'] else 'FAIL'} |")
    L.append(f"\n(before: {s2['tokens_before']} tokens; LTR deduped {s2['ltr']['deduped']}, re-encoded {s2['ltr']['encoded']} segments)\n")
    L.append(f"## S3 — Retrieval under a shared {r['budget_s3']}-token budget ({len(s3['queries'])} labeled queries)\n")
    L.append("| tool | avg reduction | hit-rate | fidelity | avg ET cost |\n|---|---|---|---|---|")
    a, b = s3["summary"]["ltr"], s3["summary"]["jay"]
    L.append(f"| LTR | **{a['avg_reduction_pct']}%** | **{a['hit_rate_pct']}%** | {'100%' if a['fidelity'] else 'FAIL'} | {a['avg_et_cost']} |")
    L.append(f"| Jay | {b['avg_reduction_pct']}% | {b['hit_rate_pct']}% | {'100%' if b['fidelity'] else 'FAIL'} | {b['avg_et_cost']} |")
    L.append("\n### Per query\n")
    L.append("| query | LTR tok / hits | Jay tok / hits |\n|---|---|---|")
    for q in s3["queries"]:
        L.append(f"| {q['query']} | {q['ltr']['tokens_after']} / {q['ltr']['hits']} | {q['jay']['tokens_after']} / {q['jay']['hits']} |")
    L.append("\nJay's tool has no selection axis; to meet the shared budget its only mechanism is truncation of its best whole-corpus encoding — the needed facts rarely survive. LTR selects the relevant verbatim segments, dedups exact repeats, and re-encodes structured blocks only under a machine-checked round-trip proof.\n")
    L.append("_Report generated by the Lumen Industries bet harness._\n")
    with open(os.path.join(HERE, "REPORT.md"), "w") as f:
        f.write("\n".join(L))


if __name__ == "__main__":
    main()
