"""Lossless invariants -- property tests with random JSON round-trips.

The hard constraint: decode(encode(x)) == x for every ADOPTED encoding, and
every non-encoded delivered segment is verbatim source text. Random structures
are generated with a seeded PRNG (no extra deps) and hammered through the
daemon's proof gate."""
import json
import random
import string

import pytest

from ltr import reduce_text, tok, verify_result
from ltr.sidecar import get_sidecar

rng = random.Random(1337)


def rand_scalar():
    return rng.choice([
        rng.randint(-10**6, 10**6),
        round(rng.uniform(-1000, 1000), 3),
        "".join(rng.choices(string.ascii_letters + string.digits + " .:_-/", k=rng.randint(0, 24))),
        rng.choice([True, False]),
        None,
        "007",           # numeric-looking string (CSV killer)
        "true",          # boolean-looking string (CSV killer)
        "",              # empty string
        "a,b\nc",        # delimiter/newline injection
        "100.70.94.19",  # dotted IP
    ])


def rand_json(depth=0):
    if depth >= 3:
        return rand_scalar()
    k = rng.random()
    if k < 0.35:
        return {f"k{j}_{rng.randint(0,99)}": rand_json(depth + 1) for j in range(rng.randint(1, 5))}
    if k < 0.6:
        return [rand_json(depth + 1) for _ in range(rng.randint(1, 6))]
    if k < 0.75:  # uniform flat array-of-objects (the tabular sweet spot)
        keys = [f"c{j}" for j in range(rng.randint(2, 5))]
        return [{key: rand_scalar() for key in keys} for _ in range(rng.randint(2, 8))]
    return rand_scalar()


@pytest.mark.parametrize("i", range(60))
def test_random_json_every_adopted_encoding_roundtrips(i):
    value = rand_json()
    r = get_sidecar().request("encode", json=json.dumps(value))
    assert r["ok"] or r.get("reason") == "not-json"
    for cand in r.get("candidates", []):
        v = get_sidecar().request(
            "verify", json=json.dumps(value), encoder=cand["name"], text=cand["text"]
        )
        assert v["ok"] and v["lossless"], f"{cand['name']} returned an unproven candidate"


@pytest.mark.parametrize("i", range(20))
def test_random_mixed_prompt_reduce_is_lossless(i):
    parts = []
    for _ in range(rng.randint(2, 6)):
        if rng.random() < 0.5:
            parts.append("```json\n" + json.dumps(rand_json(), indent=2) + "\n```")
        else:
            parts.append(" ".join(rng.choices(
                ["vault", "fleet", "node", "backup", "inference", "restart", "tailscale"],
                k=rng.randint(5, 30))))
    prompt = "\n\n".join(parts)
    res = reduce_text(prompt, tok)
    ok, problems = verify_result(prompt, res)
    assert ok, problems


def test_never_worse():
    """Encoding is adopted only when strictly cheaper -> output never exceeds input."""
    for value in ([{"a": 1}], {"x": "y"}, [{"ip": "007"}], [[1, 2], [3, 4]], "just a string in json", 42):
        prompt = "```json\n" + json.dumps(value) + "\n```"
        res = reduce_text(prompt, tok)
        assert res["tokens_after"] <= res["tokens_before"]
