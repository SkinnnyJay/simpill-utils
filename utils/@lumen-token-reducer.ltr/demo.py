"""End-to-end demo + hard lossless verification on a realistic mixed prompt:
prose memory + a fenced JSON fleet roster + an exact-duplicate paragraph.

Proves: (1) real token reduction, (2) STRICT losslessness -- every delivered
prose/code segment is byte-verbatim and every encoded JSON segment round-trips."""
import json
import subprocess
import os
from ltr import reduce_text, tok, verify_result

HERE = os.path.dirname(__file__)
CODEC = os.path.join(HERE, "codec.mjs")

roster = [
    {"host": f"node-{i}", "role": ["inference", "storage", "agent", "vault", "media"][i % 5],
     "ts_ip": f"100.{70 + i}.{i * 3}.{i + 2}", "lan_ip": f"192.168.8.{100 + i}",
     "os": "ubuntu-26.04", "cpu": ["xeon", "i3", "n100", "epyc"][i % 4],
     "ram_gb": [64, 16, 8, 256][i % 4], "status": "up",
     "ssh_user": f"node{i}", "tailscale": True}
    for i in range(15)
]
prose = ("The Ma'at / Wadjet vault HA pair stabilized after the June 26 cascade "
         "incident. Vault primary is Ma'at, Wadjet is streaming standby, HA monitor "
         "is ARMED. Safe switchover: disarm monitor, detached systemd-run, re-arm.")
dup = "Cloudflare Access is restored across all 11 hostnames plus the OAuth Worker."

prompt = "\n\n".join([
    prose,
    dup,
    "```json\n" + json.dumps(roster, indent=2) + "\n```",
    dup,  # exact duplicate -> should be deduped losslessly
    "Never switch the vault without reading the incident writeup first.",
])

res = reduce_text(prompt, tok)

print("=== LTR result (lossless mode) ===")
for k in ("tokens_before", "tokens_after", "reduction_pct",
          "segments_in", "segments_out", "deduped", "encoded"):
    print(f"  {k:16}: {res[k]}")

# ---- hard lossless verification (independent re-audit) ----
ok, problems = verify_result(prompt, res)
for p in problems:
    print("  LOSSY:", p)
assert res["deduped"] == 1, f"expected 1 dedup, got {res['deduped']}"
print("\nLOSSLESS:", "PASS -- every delivered segment is verbatim or a proven round-trip" if ok else "FAIL")
