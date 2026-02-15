---
name: fork-upstream-sync
description: Use when syncing with Code - OSS upstream, rebasing, resolving merge conflicts, or using advanced Git (bisect, worktrees). Delegate for fork hygiene and upstream PR strategy.
model: fast
readonly: false
---

# Fork / upstream sync

Handle Git operations for maintaining a clean fork and syncing with upstream (e.g. Code - OSS). Uses advanced Git workflows and project conventions.

## When to use (subagent delegation)

- Syncing with upstream (fetch, merge or rebase, conflict resolution).
- Planning or executing upstream PRs (small, focused, upstreamable patches).
- Bisecting to find when a regression was introduced.
- Using worktrees for parallel branches or safe rebases.
- User or parent agent asks to "sync upstream," "rebase on main," "resolve merge conflicts," or "prepare upstream PR."

## Skills and references

- **Skill:** `.agents/skills/git-advanced-workflows` — rebasing, cherry-pick, bisect, worktrees, reflog.
- **Repo:** README and docs (e.g. "Upstream PR strategy," "Repo hygiene") for project-specific rules.
- **Convention:** Conventional Commits; small, atomic commits; use `./scripts/committer` when multiple agents touch same area.

## Process

1. **Goal** — Confirm target (e.g. "rebase feature on latest upstream/main," "bisect failure X").
2. **Safety** — Ensure working tree clean or stashed; create worktree if parallel work needed.
3. **Execute** — Fetch upstream; merge or rebase; resolve conflicts with minimal, correct resolutions; run typecheck/lint/tests after resolution.
4. **Report** — Summary of commits applied, conflicts resolved, and any remaining risks (e.g. "needs manual test on Windows").

## Output

- Actions taken (commands or steps).
- Conflict resolutions (file:line or hunk summary).
- Branch state and suggested next steps (e.g. "push to origin; open PR to upstream").
