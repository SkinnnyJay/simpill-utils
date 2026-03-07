# Cursor configuration

This repo is an **@simpill monorepo**: utility packages under `utils/@simpill-*.utils` (Jest, Biome, TypeScript). **Sandbox apps** (e.g. todo-app) live in a separate repo: [simpill-sandbox](https://github.com/simpill/simpill-sandbox).

## Canonical locations

| Artifact | Path | Purpose |
|----------|------|---------|
| **Skills** | `.claude/skills/` | Project skills (Cursor/Claude). One folder per skill with `SKILL.md`. |
| **Commands** | `.cursor/commands/` | Command prompts (Overview, Steps, Checklist). One `.md` per command. |
| **Rules** | `.cursor/rules/` | Cursor rules (`.mdc` with frontmatter). Always-apply or file-scoped. |
| **Agents** | `.cursor/agents/` | Agent definitions. Single source; `.claude/agents` points here. |

Another skill set lives in **`.agents/skills/`** (e.g. Vitest, shadcn, Next.js patterns) for other toolchains. Not duplicated in `.claude/skills`.

**Structure and naming:** See [CONVENTIONS.md](./CONVENTIONS.md) for file format, frontmatter, and naming for commands, skills, rules, and agents.

## Running commands: monorepo vs single package

- **From repo root:** use the **Makefile** for aggregate targets, e.g. `make utils-verify`, `make utils-build`. See `make help`.
- **Single util package:** `cd utils/@simpill-<name>.utils` then `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run verify`.
- **Sandbox:** clone and run from [simpill-sandbox](https://github.com/simpill/simpill-sandbox) (not in this workspace).

The commands below (build, test, lint, etc.) assume you are either in a **single package directory** or running the corresponding **make** target from root.

## Command and skill index

| Command | Description |
|---------|-------------|
| build | Run production build and fix compilation errors (util package) |
| commit | Group changes into atomic commits; run quality gates |
| typecheck | Run type checking and fix type errors |
| test | Run test suite and fix failures |
| e2e | Run E2E tests (in simpill-sandbox repo: Playwright) |
| lint | Fix linting and formatting (Biome in utils) |
| coverage | Generate coverage report and flag gaps |
| review | Review changes for quality and conventions |

Skills in `.claude/skills/` include: bug-hunter, build-project, commit, code-quality, coverage-report, debug-browser, e2e-expert, format-and-lint, frontend-sentinel, leak-hunter, literal-hunter, process-reviews, test-forge, test-suite, typecheck, ui-designer, and others. See each skill's `SKILL.md` for its description.

## MCP

MCP servers are configured in `.cursor/mcp.json` (Playwright, Chrome DevTools, memory, etc.). Adjust per project.
