The vault service primary runs on maat-node at 192.168.8.202 with wadjet-node as streaming standby; the HA monitor is ARMED and switchover requires disarming it first.

This document is part of the fleet operations memory corpus maintained by Lumen Industries. Handle per the standing data-classification policy.

```json
[
  {
    "host": "node-00",
    "role": "inference",
    "ts_ip": "100.60.0.2",
    "lan_ip": "192.168.8.100",
    "os": "ubuntu-26.04",
    "cpu": "xeon-e5-2699v4",
    "ram_gb": 64,
    "status": "maintenance",
    "ssh_user": "op00",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-01",
    "role": "storage",
    "ts_ip": "100.61.7.3",
    "lan_ip": "192.168.8.101",
    "os": "xubuntu-26.04",
    "cpu": "i3-1115g4",
    "ram_gb": 16,
    "status": "up",
    "ssh_user": "op01",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-02",
    "role": "agent",
    "ts_ip": "100.62.14.4",
    "lan_ip": "192.168.8.102",
    "os": "debian-13",
    "cpu": "n100",
    "ram_gb": 8,
    "status": "up",
    "ssh_user": "op02",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-03",
    "role": "vault",
    "ts_ip": "100.63.21.5",
    "lan_ip": "192.168.8.103",
    "os": "ubuntu-26.04",
    "cpu": "epyc-7543p",
    "ram_gb": 256,
    "status": "up",
    "ssh_user": "op03",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-04",
    "role": "media",
    "ts_ip": "100.64.28.6",
    "lan_ip": "192.168.8.104",
    "os": "xubuntu-26.04",
    "cpu": "e5-1620",
    "ram_gb": 32,
    "status": "up",
    "ssh_user": "op04",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-05",
    "role": "backup",
    "ts_ip": "100.65.35.7",
    "lan_ip": "192.168.8.105",
    "os": "debian-13",
    "cpu": "xeon-e5-2699v4",
    "ram_gb": 64,
    "status": "up",
    "ssh_user": "op05",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-06",
    "role": "print",
    "ts_ip": "100.66.42.8",
    "lan_ip": "192.168.8.106",
    "os": "ubuntu-26.04",
    "cpu": "i3-1115g4",
    "ram_gb": 16,
    "status": "up",
    "ssh_user": "op06",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-07",
    "role": "inference",
    "ts_ip": "100.67.49.9",
    "lan_ip": "192.168.8.107",
    "os": "xubuntu-26.04",
    "cpu": "n100",
    "ram_gb": 8,
    "status": "up",
    "ssh_user": "op07",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-08",
    "role": "storage",
    "ts_ip": "100.68.56.10",
    "lan_ip": "192.168.8.108",
    "os": "debian-13",
    "cpu": "epyc-7543p",
    "ram_gb": 256,
    "status": "up",
    "ssh_user": "op08",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-09",
    "role": "agent",
    "ts_ip": "100.69.63.11",
    "lan_ip": "192.168.8.109",
    "os": "ubuntu-26.04",
    "cpu": "e5-1620",
    "ram_gb": 32,
    "status": "maintenance",
    "ssh_user": "op09",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-10",
    "role": "vault",
    "ts_ip": "100.70.70.12",
    "lan_ip": "192.168.8.110",
    "os": "xubuntu-26.04",
    "cpu": "xeon-e5-2699v4",
    "ram_gb": 64,
    "status": "up",
    "ssh_user": "op10",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-11",
    "role": "media",
    "ts_ip": "100.71.77.13",
    "lan_ip": "192.168.8.111",
    "os": "debian-13",
    "cpu": "i3-1115g4",
    "ram_gb": 16,
    "status": "up",
    "ssh_user": "op11",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-12",
    "role": "backup",
    "ts_ip": "100.72.84.14",
    "lan_ip": "192.168.8.112",
    "os": "ubuntu-26.04",
    "cpu": "n100",
    "ram_gb": 8,
    "status": "up",
    "ssh_user": "op12",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-13",
    "role": "print",
    "ts_ip": "100.73.91.15",
    "lan_ip": "192.168.8.113",
    "os": "xubuntu-26.04",
    "cpu": "epyc-7543p",
    "ram_gb": 256,
    "status": "up",
    "ssh_user": "op13",
    "tailscale": true,
    "static_ip": true
  },
  {
    "host": "node-14",
    "role": "inference",
    "ts_ip": "100.74.98.16",
    "lan_ip": "192.168.8.114",
    "os": "debian-13",
    "cpu": "e5-1620",
    "ram_gb": 32,
    "status": "up",
    "ssh_user": "op14",
    "tailscale": true,
    "static_ip": true
  }
]
```

This document is part of the fleet operations memory corpus maintained by Lumen Industries. Handle per the standing data-classification policy.

Vault switchover procedure: disarm the HA monitor, launch the promotion as a detached systemd-run unit, verify replication catch-up, then re-arm the monitor. NEVER promote while the monitor is armed.

#CORE safety: NEVER reboot a fleet node without explicit operator permission.

```json
{
  "alert_queue": {
    "path": "/var/lib/aq/alerts.db",
    "drain_minutes": 30,
    "classes": [
      "dns",
      "unit-restart",
      "disk"
    ]
  }
}
```

budget probe telemetry probe renewal heartbeat drift latency heartbeat capacity envelope scheduler scheduler scheduler renewal heartbeat quorum envelope envelope quorum sentinel errorrate renewal renewal heartbeat renewal watchdog probe renewal lease heartbeat forecast drift sentinel latency throughput drift heartbeat forecast errorrate drift errorrate budget throughput latency envelope drift cadence cadence utilisation probe budget cadence quorum throughput baseline window renewal percentile baseline.