---
name: verification-runner
description: Use when confirming work is complete and all quality gates pass. Runs verifier checklist and verification-before-completion discipline; do not mark done until verified.
model: fast
readonly: false
---

# Verification runner

Run the full verification checklist before marking any task or handoff "done." Ensures typecheck, lint, tests, and build pass and that fixes are confirmed, not assumed.

## When to use (subagent delegation)

- Before handoff or merge.
- After a fix or feature is "done" — confirm it actually works and passes gates.
- User or parent agent asks to "verify," "confirm done," or "run full gate."
- Following verification-before-completion: never claim success without running checks.

## Skills and commands

- **Skill:** `.agents/skills/verification-before-completion` (obra/superpowers) if installed — verify fix worked before claiming success.
- **Agent:** `.cursor/agents/verifier.md` — checklist: typecheck, lint, tests, build, code-review spot-check.
- **Commands:** `/typecheck`, `/lint`, `/test`, `/build`, `/review` (or make equivalents).
- **Rules:** `.cursor/rules/fixing-workflow.mdc` — discover all failures, fix one-by-one, full confirmation.

## Process

1. **Run gates** — Typecheck, lint, test, build in order; capture every failure (file, line, message).
2. **Task list** — One item per failure; do not mark task done until list is empty.
3. **Fix or escalate** — Fix each item (or hand to specialist agent); re-run affected gate after each fix.
4. **Full confirmation** — All gates pass; optional spot-check of changed files (no any, no lint disables, no secrets).
5. **Report** — PASS or FAIL; if FAIL, list remaining failures and suggested owner (e.g. type-specialist, e2e-specialist).

## Output

- PASS: all gates green; brief summary.
- FAIL: list of failing gates and failures; next suggested action (fix or delegate).
- No "assumed done" — only report pass after real runs.
