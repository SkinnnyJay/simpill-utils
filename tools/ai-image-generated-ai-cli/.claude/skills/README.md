# Project skills

Project skills for Cursor and Claude Code. One **folder per skill** with a **`SKILL.md`** file.

## Format

Each `SKILL.md` must have:

- **Frontmatter:** `name`, `description`
  - `name` — Lowercase, kebab-case, max 64 chars (e.g. `commit`, `bug-hunter`, `format-and-lint`).
  - `description` — Third person; **what** the skill does and **when** to use it (WHAT + WHEN). Max 1024 chars.
- **Body:** Instructions, process, examples. Keep main file under ~500 lines; use supporting files for deep reference.

## Naming

- Use **kebab-case**: `code-quality`, `e2e-expert`, `format-and-lint`.
- Prefer **verb or verb-noun** where it helps: `find-bugs` (or `bug-hunter`), `run-tests`, `commit-changes` (or `commit`).
- Avoid vague names like `helper` or `utils`; be specific.

## Index

| Skill | Purpose |
|-------|---------|
| bug-hunter | Deep static analysis; non-obvious bugs, security, performance, AI slop. |
| build-project | Run and fix production builds. |
| commit | Atomic commits, conventional format, quality gates. |
| code-quality | Type safety, limits, naming, conventions. |
| coverage-report | Coverage reports and gap analysis. |
| debug-browser | Browser debugging and DevTools. |
| e2e-expert | E2E testing (e.g. Playwright) and fixing failures. |
| format-and-lint | Lint and format fixes. |
| frontend-sentinel | Frontend quality and patterns. |
| leak-hunter | Memory and resource leaks. |
| literal-hunter | Magic numbers and string literals. |
| process-reviews | Review workflow and feedback. |
| test-forge | Writing and designing tests. |
| test-suite | Running and interpreting test suites. |
| typecheck | Type checking and fixing type errors. |
| ui-designer | UI design and accessibility. |
| system-architect | Architecture and system design. |
| swift-eng | Swift and Apple platform. |
| continue-building | Continue or extend existing work. |

See each skill’s `SKILL.md` for full description and instructions.
