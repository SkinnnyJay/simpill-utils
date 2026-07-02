"""Persistent codec daemon manager (Lumen Industries).

Replaces per-call `node` spawns with one long-lived sidecar speaking JSONL
over stdin/stdout. Restarts transparently if the process dies. Thread-safe
via a single lock (requests are cheap and serialized)."""
import json
import os
import subprocess
import threading
import atexit

_CODEC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "codec.mjs")


class Sidecar:
    def __init__(self, codec_path=_CODEC):
        self._codec = codec_path
        self._lock = threading.Lock()
        self._proc = None
        self._id = 0
        atexit.register(self.close)

    def _ensure(self):
        if self._proc is None or self._proc.poll() is not None:
            self._proc = subprocess.Popen(
                ["node", self._codec, "daemon"],
                stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL, text=True, bufsize=1,
            )

    def request(self, op, **payload):
        with self._lock:
            for attempt in (1, 2):  # one transparent restart on a dead pipe
                self._ensure()
                self._id += 1
                msg = json.dumps({"id": self._id, "op": op, **payload})
                try:
                    self._proc.stdin.write(msg + "\n")
                    self._proc.stdin.flush()
                    line = self._proc.stdout.readline()
                    if line:
                        return json.loads(line)
                except (BrokenPipeError, OSError):
                    pass
                self._proc = None  # force respawn, retry once
            raise RuntimeError("codec sidecar unavailable")

    def close(self):
        if self._proc and self._proc.poll() is None:
            try:
                self._proc.stdin.close()
                self._proc.wait(timeout=3)
            except Exception:
                self._proc.kill()
        self._proc = None


_default = None
_default_lock = threading.Lock()


def get_sidecar():
    global _default
    with _default_lock:
        if _default is None:
            _default = Sidecar()
        return _default
