"""Authoritative token counts via the persistent gpt-tokenizer daemon --
the same tokenizer Jay's benchmark uses, so all comparisons are apples to
apples. Memoized. (Lumen Industries)"""
from .sidecar import get_sidecar

_cache = {}


def tok(text: str) -> int:
    if text in _cache:
        return _cache[text]
    r = get_sidecar().request("count", text=text)
    n = int(r.get("tokens", 0)) if r.get("ok") else 0
    _cache[text] = n
    return n
