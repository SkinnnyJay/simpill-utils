"""Selection axis (Lumen Industries) -- the multiplicative lever.

Given a query and a list of segments, rank segments by relevance using
Minerva's hybrid retrieval recipe (dense bge-m3 embeddings + BM25 + RRF)
and SELECT whole verbatim segments. Selection never alters kept text --
it only drops whole segments -- so it is lossless by construction w.r.t.
delivered content.

Wiring: we import embed()/cosine()/bm25_scores()/tokenize() from Minerva's
/home/lumen/minerva/context/context_selector.py READ-ONLY when present, so
the embedding endpoint/model config stays in one place. If Minerva (or the
Ollama embed endpoint) is unavailable, we fail safe to BM25-only ranking.
"""
import math
import re
import sys

MINERVA_CTX = "/home/lumen/minerva/context"
RRF_K = 60

_cs = None


def _minerva():
    """Read-only import of Minerva's context_selector (embed/bm25 primitives)."""
    global _cs
    if _cs is None:
        try:
            if MINERVA_CTX not in sys.path:
                sys.path.insert(0, MINERVA_CTX)
            import context_selector as cs  # noqa
            _cs = cs
        except Exception:
            _cs = False
    return _cs or None

# ---- local BM25 fallback (same algorithm as Minerva's, self-contained) ------
_TOK = re.compile(r"[a-z0-9]+(?:[._:-][a-z0-9]+)*")
_K1, _B = 1.5, 0.75


def _tokenize(text):
    cs = _minerva()
    if cs is not None:
        try:
            return cs.tokenize(text)
        except Exception:
            pass
    return _TOK.findall(text.lower())


def _bm25(query, texts):
    q = [t for t in _tokenize(query) if len(t) > 1]
    if not q:
        return {}
    docs = [_tokenize(t) for t in texts]
    n = len(docs) or 1
    avglen = (sum(len(d) for d in docs) / n) or 1.0
    df = {qt: sum(1 for d in docs if qt in d) for qt in set(q)}
    scores = {}
    for i, d in enumerate(docs):
        if not d:
            continue
        s = 0.0
        for qt in q:
            f = d.count(qt)
            if not f:
                continue
            idf = math.log(1 + (n - df[qt] + 0.5) / (df[qt] + 0.5))
            s += idf * (f * (_K1 + 1)) / (f + _K1 * (1 - _B + _B * len(d) / avglen))
        if s > 0:
            scores[i] = s
    return scores


def _dense(query, texts):
    """Cosine of query vs each segment via Minerva's embed (bge-m3 on Ollama).
    Segment embeddings are memoized (corpora are re-queried far more often
    than they change). Returns {} on any failure -> BM25-only degrade."""
    cs = _minerva()
    if cs is None:
        return {}
    try:
        q = cs.embed(query)
        if q is None:
            return {}
        out = {}
        for i, t in enumerate(texts):
            v = _EMB_CACHE.get(t)
            if v is None and t not in _EMB_CACHE:
                v = cs.embed(t)
                _EMB_CACHE[t] = v
            if v is not None:
                out[i] = cs.cosine(q, v)
        return out
    except Exception:
        return {}


_EMB_CACHE = {}


def _ranks(score_map):
    order = sorted(score_map, key=lambda i: -score_map[i])
    return {idx: r + 1 for r, idx in enumerate(order)}

PIN_PATTERN = re.compile(r"#CORE\b|#SAFETY\b|NEVER\b|MUST\b", re.IGNORECASE)


def is_pinned(seg):
    return bool(seg.get("pinned")) or bool(PIN_PATTERN.search(seg.get("text", "")[:400]))


def rank_segments(segs, query):
    """Hybrid rank: RRF fusion of dense-cosine ranks and BM25 ranks.
    Returns list of (idx, rrf_score) sorted best-first over ALL segments."""
    texts = [s["text"] for s in segs]
    bm = _bm25(query, texts)
    dn = _dense(query, texts)
    rb, rd = _ranks(bm), _ranks(dn)
    fused = {}
    for i in range(len(segs)):
        s = 0.0
        if i in rb:
            s += 1.0 / (RRF_K + rb[i])
        if i in rd:
            s += 1.0 / (RRF_K + rd[i])
        fused[i] = s
    return sorted(fused.items(), key=lambda kv: -kv[1])


def make_selector(top_k=8, keep_pinned=True):
    """Build a `select(segs, query)` hook for reduce_text.

    Keeps: all pinned segments (core/safety -- never dropped) + the top_k
    most relevant segments by hybrid rank. Original document order is
    preserved among kept segments (selection only, no re-writing)."""
    def select(segs, query):
        if not query or len(segs) <= 1:
            return segs
        ranked = rank_segments(segs, query)
        keep = {i for i, sc in ranked[:top_k] if sc > 0}
        if keep_pinned:
            keep |= {i for i, s in enumerate(segs) if is_pinned(s)}
        if not keep:  # fail-safe: never select down to nothing
            return segs
        out = []
        for i, s in enumerate(segs):
            if i in keep:
                ns = dict(s)
                ns["sel_rank"] = next((r for r, (j, _) in enumerate(ranked) if j == i), None)
                out.append(ns)
        return out
    return select
