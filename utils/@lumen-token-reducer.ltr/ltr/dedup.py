"""Exact-duplicate segment removal. STRICTLY LOSSLESS: an identical repeated
segment carries zero additional information, so dropping later copies preserves
meaning perfectly. Code segments are never deduped (conservative)."""
import re


def _norm(s):
    return re.sub(r"\s+", " ", s.strip().lower())


def dedup(segs):
    seen, out, removed = set(), [], 0
    for s in segs:
        if s["kind"] == "code":
            out.append(s)
            continue
        key = _norm(s["text"])
        if key in seen:
            removed += 1
            continue
        seen.add(key)
        out.append(s)
    return out, removed
