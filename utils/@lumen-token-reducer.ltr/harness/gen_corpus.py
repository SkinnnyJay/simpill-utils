#!/usr/bin/env python3
"""Deterministic corpus generator for the LTR vs @simpill/token-optimizer bet.
Seeded; commit the generated files so the bet inputs are frozen."""
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "corpus")
rng = random.Random(4242)

ROLES = ["inference", "storage", "agent", "vault", "media", "backup", "print"]
OSES = ["ubuntu-26.04", "xubuntu-26.04", "debian-13"]
CPUS = ["xeon-e5-2699v4", "i3-1115g4", "n100", "epyc-7543p", "e5-1620"]

roster = [
    {"host": f"node-{i:02d}", "role": ROLES[i % len(ROLES)],
     "ts_ip": f"100.{60 + i}.{(i * 7) % 250}.{i + 2}",
     "lan_ip": f"192.168.8.{100 + i}", "os": OSES[i % 3],
     "cpu": CPUS[i % 5], "ram_gb": [64, 16, 8, 256, 32][i % 5],
     "status": "up" if i % 9 else "maintenance",
     "ssh_user": f"op{i:02d}", "tailscale": True, "static_ip": True}
    for i in range(40)
]

FACTS = [
    ("vaultsvc", "The vault service primary runs on maat-node at 192.168.8.202 with wadjet-node as streaming standby; the HA monitor is ARMED and switchover requires disarming it first."),
    ("switchover", "Vault switchover procedure: disarm the HA monitor, launch the promotion as a detached systemd-run unit, verify replication catch-up, then re-arm the monitor. NEVER promote while the monitor is armed."),
    ("backups", "Nightly Borg backups land on anubis-node at 192.168.8.107; the repository passphrase lives in the ops vault under infra/borg-repo; retention is 14 daily, 8 weekly."),
    ("gitea", "Gitea serves on anubis-node port 3300 behind the zero-trust proxy; mirror pushes go out at 04:15 via a deploy key named fleet-mirror."),
    ("media", "Plex, Sonarr, Radarr and Prowlarr run on thoth-node 192.168.8.218 with a NordVPN kill-switch on the torrent namespace; if the VPN drops, qBittorrent must halt."),
    ("printsvc", "The Samsung M2020W print server is hosted on apep-node; CUPS listens on 631 and the queue name is fleet-mono."),
    ("embeddings", "Dense embeddings are served by bge-m3 on Ollama at 127.0.0.1:11434; the hybrid retriever fuses cosine similarity with BM25 via reciprocal rank fusion, RRF k=60."),
    ("gateway", "All model calls route through the LiteLLM gateway on localhost:4000; direct provider calls from fleet services are forbidden."),
    ("alerts", "The alert queue is SQLite at /var/lib/aq/alerts.db; the corrector service drains it every 30 minutes and auto-fixes only allow-listed failure classes."),
    ("kernel", "All fleet nodes completed the kernel 7.0.0-27 upgrade; nodes still on 7.0.0-22 must not be rebooted until the initramfs audit passes."),
    ("provision", "New nodes are provisioned via the SSH-direct path fleet-provision-ssh; every node gets a static LAN IP in netplan, never DHCP."),
    ("tunnel", "Public hostnames terminate on cloudflared tunnels; the OAuth worker fronts the MCP endpoint and unauthenticated MCP exposure is a critical incident."),
]

SAFETY = [
    "#CORE safety: NEVER reboot a fleet node without explicit operator permission.",
    "#CORE safety: every container, database, or config change MUST be preceded by a restic backup plus a per-database copy.",
]

BOILER = "This document is part of the fleet operations memory corpus maintained by Lumen Industries. Handle per the standing data-classification policy."

FILLER_WORDS = ("telemetry rotation window scheduler heartbeat cadence quorum lease renewal "
                "watchdog probe sentinel drift baseline capacity forecast utilisation envelope "
                "throughput saturation percentile latency budget errorrate rollout canary").split()


def filler(n):
    return " ".join(rng.choices(FILLER_WORDS, k=n)) + "."

def main():
    os.makedirs(OUT, exist_ok=True)

    # S1 — pure structured (his best case)
    with open(os.path.join(OUT, "fleet_roster.json"), "w") as f:
        f.write(json.dumps(roster, indent=2))

    # S2 — arbitrary mixed prompt (no query): prose + fenced JSON + exact dup
    mixed = "\n\n".join([
        FACTS[0][1], BOILER,
        "```json\n" + json.dumps(roster[:15], indent=2) + "\n```",
        BOILER,  # exact duplicate
        FACTS[1][1], SAFETY[0],
        "```json\n" + json.dumps({"alert_queue": {"path": "/var/lib/aq/alerts.db",
            "drain_minutes": 30, "classes": ["dns", "unit-restart", "disk"]}}, indent=2) + "\n```",
        filler(60),
    ])
    with open(os.path.join(OUT, "mixed_prompt.md"), "w") as f:
        f.write(mixed)

    # S3 — retrieval battlefield: every fact buried in filler + dups + JSON blocks
    parts = list(SAFETY)
    for key, fact in FACTS:
        parts.append(filler(rng.randint(40, 90)))
        parts.append(fact)
        parts.append(BOILER)          # repeated boilerplate throughout (dedup fodder)
        parts.append(filler(rng.randint(40, 90)))
    parts.append("```json\n" + json.dumps(roster, indent=2) + "\n```")
    parts.append(BOILER)
    rng.shuffle(parts)
    # keep safety lines present wherever the shuffle put them; that's realistic
    with open(os.path.join(OUT, "memory_corpus.md"), "w") as f:
        f.write("\n\n".join(parts))

    queries = [
        {"query": "how do I switch the vault primary safely?",
         "must_survive": ["disarm the HA monitor", "systemd-run", "re-arm"]},
        {"query": "where do nightly backups go and what's the retention?",
         "must_survive": ["anubis-node", "192.168.8.107", "14 daily"]},
        {"query": "what happens to torrents if the VPN drops?",
         "must_survive": ["NordVPN kill-switch", "qBittorrent must halt"]},
        {"query": "which endpoint serves dense embeddings for retrieval?",
         "must_survive": ["bge-m3", "127.0.0.1:11434"]},
        {"query": "how are model calls routed for fleet services?",
         "must_survive": ["LiteLLM gateway", "localhost:4000"]},
        {"query": "what is the alert queue and how often is it drained?",
         "must_survive": ["/var/lib/aq/alerts.db", "30 minutes"]},
    ]
    with open(os.path.join(OUT, "queries.json"), "w") as f:
        f.write(json.dumps(queries, indent=2))
    print("corpus written:", os.listdir(OUT))


if __name__ == "__main__":
    main()
