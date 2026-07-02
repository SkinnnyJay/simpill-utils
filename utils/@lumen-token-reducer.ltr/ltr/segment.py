"""Split a prompt into typed segments: json / code / prose.

Segmentation is what lets us route each part to the right lossless treatment --
the thing Jay's whole-prompt single-strategy design cannot do."""
import json
import re

_FENCE = re.compile(r"```(\w+)?\n(.*?)```", re.DOTALL)


def _try_json(s):
    s = s.strip()
    if not s or s[0] not in "[{":
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


def _split_prose(chunk):
    out = []
    for part in re.split(r"\n\s*\n", chunk):
        if not part.strip():
            continue
        data = _try_json(part)
        if data is not None:
            out.append({"kind": "json", "text": part, "inner": part, "data": data})
        else:
            out.append({"kind": "prose", "text": part.strip(), "data": None})
    return out


def segment(text):
    segs, pos = [], 0
    for m in _FENCE.finditer(text):
        if m.start() > pos:
            segs.extend(_split_prose(text[pos:m.start()]))
        lang = (m.group(1) or "").lower()
        body = m.group(2)
        data = _try_json(body) if lang in ("json", "") else None
        segs.append({
            "kind": "json" if data is not None else "code",
            "text": m.group(0), "inner": body, "data": data,
        })
        pos = m.end()
    if pos < len(text):
        segs.extend(_split_prose(text[pos:]))
    return segs
