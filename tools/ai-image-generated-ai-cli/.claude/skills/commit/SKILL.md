---
name: commit
description: Groups changed files into atomic commits with conventional format. Use when ready to commit, when the user asks for commit help, or when multiple agents work in the same folder (use scripts/committer).
---

# Commit

Group changed files into logical, atomic commits using the project's conventional commit format.

## Commit Format

```
<type>(<scope>): <summary>
```

- **Types**: feat, fix, chore, refactor, docs, test
- **Scope**: affected area (package name, api, ui, etc.)
- **Summary**: present tense, imperative mood, under 72 chars

## Examples

```
feat(async.utils): add retry logic to polling manager
fix(api): handle null in schedule-runs endpoint
chore(deps): bump next to 14.2.1
refactor(collections.utils): extract storage interface
docs(readme): update architecture diagram
test(e2e): add flow spec
```

## Process

1. Run `git status` and `git diff --staged` to see all changes.
2. Analyze changed files and group by logical change.
3. Stage each group: `git add <files>` — or use `./scripts/committer -m "<type>: <summary>" path1 path2` for atomic commits (recommended when multiple agents work in the same folder).
4. Commit with the format below; repeat for each logical group.
5. Verify with `git log --oneline -5`.

## Rules

- One logical change per commit.
- Never commit `.env`, credentials, or secrets.
- Run the project’s lint and typecheck before committing.
