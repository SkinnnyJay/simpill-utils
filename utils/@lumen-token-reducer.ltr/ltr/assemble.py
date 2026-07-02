"""Cache-aware assembly (Lumen Industries).

Order STABLE content first so LLM prompt-cache prefixes hit:
  1. pinned/core/safety segments, in original document order (stable prefix,
     ALWAYS included -- the budget never drops them),
  2. everything else in original document order.
Then enforce a hard token budget by dropping whole lowest-relevance
non-pinned segments (selection, still lossless w.r.t. delivered text).
"""
from .select import is_pinned

SEP = "\n\n"


def assemble(segs, tok, budget=None):
    pinned = [s for s in segs if is_pinned(s)]
    rest = [s for s in segs if not is_pinned(s)]
    ordered = pinned + rest

    dropped = 0
    if budget:
        sep_cost = tok(SEP)
        used = 0
        kept_pinned = []
        for s in pinned:  # core/safety: always included, even over budget
            used += tok(s["text"]) + (sep_cost if kept_pinned else 0)
            kept_pinned.append(s)
        # non-pinned: worst-relevance dropped first when over budget
        by_rel = sorted(
            rest, key=lambda s: s.get("sel_rank") if s.get("sel_rank") is not None else -1
        )  # best (lowest rank) first; unranked treated as best (rank -1)
        kept_rest = []
        for s in by_rel:
            c = tok(s["text"]) + sep_cost
            if used + c > budget:
                dropped += 1
                continue
            used += c
            kept_rest.append(s)
        keep_ids = {id(s) for s in kept_pinned + kept_rest}
        ordered = [s for s in ordered if id(s) in keep_ids]

    return SEP.join(s["text"] for s in ordered), dropped
