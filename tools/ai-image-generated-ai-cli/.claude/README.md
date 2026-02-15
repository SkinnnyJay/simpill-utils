# .claude — Claude Code configuration

Claude Code (claude.ai/code) project configuration for Pointer IDE.

## Contents

| Path | Purpose |
|------|---------|
| **skills/** | Project skills (Cursor/Claude). One folder per skill with `SKILL.md`. Canonical location for skill definitions. |
| **docs/** | Architecture and API reference. Not Cursor rules. |
| **rules/** | Pointer only — Cursor rules live in `.cursor/rules/`. |
| **agents/** | Pointer only — Agent definitions live in `.cursor/agents/`. |
| **settings.local.json** | Claude Code permissions (allowlist for npm, npx, bash, etc.). Adjust per project. |

## Align with .cursor and .agents

- **Commands, rules, agents:** Defined in `.cursor/`. This folder does not duplicate them.
- **Skills:** Defined here in `.claude/skills/`. Use for project-specific workflows (commit, code review, testing, lint, etc.).
- **Reference skills:** In `.agents/skills/` (Vitest, shadcn, Next.js, Prisma, etc.). Reference when needed; not duplicated here.

## Skill index (project skills)

Skills in `.claude/skills/` follow one folder per skill with a `SKILL.md` that includes:

- **name** — Lowercase, kebab-case (e.g. `commit`, `bug-hunter`).
- **description** — Third person; what the skill does and when to use it (WHAT + WHEN).

Current project skills: bug-hunter, build-project, commit, code-quality, coverage-report, debug-browser, e2e-expert, format-and-lint, frontend-sentinel, leak-hunter, literal-hunter, process-reviews, test-forge, test-suite, typecheck, ui-designer, system-architect, swift-eng, continue-building. See each skill’s `SKILL.md` for details.
