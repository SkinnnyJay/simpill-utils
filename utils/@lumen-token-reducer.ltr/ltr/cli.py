"""ltr CLI (Lumen Industries).

  ltr reduce <file> [--query Q] [--budget N] [--top-k K] [--report] [--verify]
  ltr count  <file>

Arbitrary-prompt mode: segment/dedup/encode only.
Corpus mode: add --query to switch on hybrid selection (Minerva bge-m3 + BM25
+ RRF; degrades to BM25-only if the embed endpoint is down)."""
import argparse
import json
import sys

from .reducer import reduce_text, verify_result
from .select import make_selector
from .tokens import tok


def main(argv=None):
    ap = argparse.ArgumentParser(prog="ltr", description="Lumen Token Reducer -- strictly lossless")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("reduce", help="losslessly reduce a prompt/corpus file")
    r.add_argument("file")
    r.add_argument("--query", default=None, help="enable selection axis for this query")
    r.add_argument("--budget", type=int, default=None, help="hard output token budget")
    r.add_argument("--top-k", type=int, default=8, help="segments kept by selection")
    r.add_argument("--model", default="sonnet", help="ET model multiplier (haiku/sonnet/opus/deepseek)")
    r.add_argument("--report", action="store_true", help="print JSON report to stderr")
    r.add_argument("--verify", action="store_true", help="independent lossless re-audit")

    c = sub.add_parser("count", help="authoritative gpt-tokenizer count")
    c.add_argument("file")

    a = ap.parse_args(argv)
    text = sys.stdin.read() if a.file == "-" else open(a.file, encoding="utf-8").read()

    if a.cmd == "count":
        print(tok(text))
        return 0

    select = make_selector(top_k=a.top_k) if a.query else None
    res = reduce_text(text, tok, select=select, query=a.query, budget=a.budget, model=a.model)

    if a.verify:
        ok, problems = verify_result(text, res)
        if not ok:
            for p in problems:
                print(f"LOSSY: {p}", file=sys.stderr)
            print("VERIFY: FAIL", file=sys.stderr)
            return 2
        print("VERIFY: PASS (all delivered segments verbatim or proven round-trips)", file=sys.stderr)

    if a.report:
        rep = {k: v for k, v in res.items() if k not in ("output", "_segments")}
        print(json.dumps(rep, indent=2), file=sys.stderr)

    sys.stdout.write(res["output"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
