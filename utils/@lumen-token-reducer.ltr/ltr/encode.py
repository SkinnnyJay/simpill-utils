"""Per-segment best-encoder selection (Lumen Industries).

For each JSON segment the daemon tries EVERY lossless encoder (TOON, TONL,
CSV, YAML, JSON-min), machine-proves each round-trip (decode == original,
deep equal), and returns only the proven candidates. We adopt the fewest-token
proven candidate ONLY if it is strictly cheaper than the verbatim segment.
Anything unproven or not-cheaper stays verbatim. Never-worse, always-lossless."""
import json

from .sidecar import get_sidecar


def encode_segment(seg, tok):
    if seg.get("kind") != "json" or seg.get("data") is None:
        return seg, False
    src = seg.get("inner") or seg["text"]
    r = get_sidecar().request("encode", json=json.dumps(seg["data"]))
    if not r.get("ok") or not r.get("candidates"):
        return seg, False
    best = r["candidates"][0]  # proven-lossless, fewest tokens
    if best["tokens"] < tok(seg["text"]):
        new = dict(seg)
        new["text"] = best["text"]
        new["encoded"] = best["name"]
        return new, True
    return seg, False


def verify_encoding(seg):
    """Independent re-proof of an adopted encoding (used by tests/--verify)."""
    if "encoded" not in seg:
        return True
    r = get_sidecar().request(
        "verify", json=json.dumps(seg["data"]), encoder=seg["encoded"], text=seg["text"]
    )
    return bool(r.get("ok") and r.get("lossless"))
