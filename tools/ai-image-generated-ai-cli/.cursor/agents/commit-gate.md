---
name: commit-gate
description: Use when preparing atomic commits and running pre-commit quality gates. Delegate for grouping changes, conventional format, and ensuring lint/typecheck/test pass before commit.
model: fast
readonly: false
---

# Commit gate

Prepare changes for commit: group into atomic commits, apply conventional format, and run quality gates (lint, typecheck, test). Use project committer script when multiple agents work in the same folder.

## When to use (subagent delegation)

- User or parent agent asks to "commit changes," "prepare commit," or "run quality gate."
- After a task is done and changes need to be committed atomically.
- Enforcing conventional commits and pre-commit checks before push.

## Skills and commands

- **Skill:** `.claude/skills/commit` (project) — atomic commits, conventional format, quality gates.
- **Command:** `/commit` or `make commit`; use `./scripts/committer -m "<type>: <summary>" path1 path2` or `make commit FILES="path1 path2" MSG="<type>: <summary>"` for atomic groups.
- **Gates:** Lint and typecheck must pass; run tests when applicable; never commit secrets or `.env`.

## Process

1. **Review** — `git status`, `git diff` (staged and unstaged); list all changed files.
2. **Group** — Logical, atomic commits (e.g. one commit per feature or fix); type: feat, fix, chore, refactor, docs, test. Message: `<type>(<scope>): <summary>`, imperative, &lt;72 chars.
3. **Gate** — Run `make lint` and `make typecheck` (or project equivalent); run tests if defined; fix any failure before committing.
4. **Commit** — Stage per group; commit with message; or use `scripts/committer` for explicit paths.

## Output

- List of commits created (message and files).
- Confirmation that lint, typecheck, and tests passed.
- Reminder: no `.env` or secrets in commits.
