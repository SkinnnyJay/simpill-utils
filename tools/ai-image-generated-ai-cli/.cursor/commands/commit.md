---
description: Group changes into atomic commits with conventional format; run quality gates. Use committer when multiple agents work in same folder.
---

# Commit

## Overview

Group changed files into logical, atomic commits using conventional commit format. Ensure quality gates pass before committing. For atomic commits when multiple agents work in the same folder, use `./scripts/committer -m "<type>: <summary>" path1 path2` or `make commit FILES="path1 path2" MSG="<type>: <summary>"`.

## Steps

1. **Review changes** — Run `git status` and `git diff --staged` (or `git diff`) to see all changes.
2. **Plan commits** — Group files into logical, atomic commits. Use format: `<type>(<scope>): <summary>`. Types: feat, fix, chore, refactor, docs, test. Present tense, imperative, under 72 characters.
3. **Quality gate** — Run the project’s lint and typecheck (e.g. `npm run lint && npm run typecheck` or `make lint`) before committing.
4. **Commit** — Stage each group and commit (or use `scripts/committer` for listed paths only).
5. **Never commit** `.env`, credentials, or secrets.

## Checklist

- [ ] Changes reviewed (git status, git diff)
- [ ] Commits atomic and logically grouped
- [ ] Message format: `<type>(<scope>): <summary>`
- [ ] Lint and typecheck pass
- [ ] No secrets or .env in commit
