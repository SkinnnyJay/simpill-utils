# .cursor — Cursor IDE configuration

Pointer IDE project. Canonical home for **commands**, **rules**, and **agents** shared across Cursor and referenced by Claude Code (`.claude` points here).

## Canonical locations

| Artifact | Path | Purpose |
|----------|------|---------|
| **Commands** | `.cursor/commands/` | Slash-command prompts. One `.md` per command: Overview, Steps, Checklist. |
| **Rules** | `.cursor/rules/` | Cursor rules (`.mdc` with frontmatter). Always-apply or file-scoped. |
| **Agents** | `.cursor/agents/` | Agent definitions (name, description, behavior). Single source; `.claude/agents` points here. |
| **Skills** | `.claude/skills/` | Project skills (Cursor/Claude). One folder per skill with `SKILL.md`. |
| **Reference skills** | `.agents/skills/` | Toolchain/reference skills (Vitest, shadcn, debugging, architecture, etc.). Symlinked into `.claude/skills/` and `.cursor/skills/`. |
| **Cursor skills** | `.cursor/skills/` | Symlinks to `.agents/skills/` and `.claude/skills/` so Cursor sees all skills. |

## Running commands

- **From repo root:** use the **Makefile** (e.g. `make build`, `make test`, `make lint`). See `make help`.
- **From a package/app directory:** use `npm run <script>` or the project’s test/lint/build commands per its `package.json`.

Commands below assume you are either in a package directory or running the corresponding **make** target from root.

## Command index

| Command | Description |
|---------|-------------|
| **build** | Run production build and fix compilation errors; follow fixing workflow. |
| **commit** | Group changes into atomic commits (conventional format); run quality gates. Use `scripts/committer` when multiple agents work in the same folder. |
| **typecheck** | Run type checking and fix type errors; follow fixing workflow. |
| **test** | Run test suite and fix failures systematically; follow fixing workflow. |
| **e2e** | Run E2E tests (e.g. Playwright) and fix failures; follow fixing workflow. |
| **lint** | Fix linting and formatting; follow fixing workflow. |
| **coverage** | Generate coverage report and flag low-coverage areas. |
| **review** | Review changes for quality, correctness, and conventions; report with severity and file:line. |

## Agent index

Agents are defined in `.cursor/agents/*.md`. Use them as **subagents**: delegate by name (e.g. "Use the root-cause-debugger to find why this fails") or via Cursor/Claude Code agent picker. They reference project **skills** (`.agents/skills/`, `.claude/skills/`) and **commands** (`.cursor/commands/`). See [Cursor Agent](https://docs.cursor.com/agent/overview), [Claude Code subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents), and [Codex subagents](https://github.com/leonardsellem/codex-subagents-mcp) for platform behavior.

### Core (review, verify, test, security, research, debug)

| Agent | Use when |
|-------|----------|
| **code-reviewer** | Reviewing PRs or changes for quality, patterns, and best practices. |
| **verifier** | Validating completed work (typecheck, lint, tests, build, review checklist). |
| **test-runner** | Running test suites and interpreting failures. |
| **security-reviewer** | Reviewing auth, sensitive data, API routes, or security-critical paths. |
| **researcher** | Deep exploration of codebase, dependencies, or architecture. |
| **debugger** | Investigating failures, errors, or unexpected behavior; root-cause analysis. |

### Specialists (subagent delegation)

| Agent | Use when |
|-------|----------|
| **root-cause-debugger** | Strict root-cause investigation before any fix; uses systematic-debugging skill. |
| **performance-profiler** | Startup, memory, UI jank; Electron/Chromium profiling; leak-hunter, debugging-strategies. |
| **architect** | Architecture decisions, module boundaries, ADRs; architecture-patterns, monorepo. |
| **type-specialist** | Complex TypeScript types, type errors; typescript-advanced-types; /typecheck. |
| **e2e-specialist** | E2E tests (Playwright/Cypress); e2e-testing-patterns, e2e-expert; /e2e. |
| **fork-upstream-sync** | Upstream sync, rebase, merge conflicts, bisect, worktrees; git-advanced-workflows. |
| **monorepo-navigator** | Package boundaries, dependency impact, "who depends on X"; monorepo-management. |
| **react-ui-specialist** | React UI, webviews, renderer; vercel-react-best-practices; bundle/rerender. |
| **rust-native-helper** | Rust or native code; rust-async-patterns; async, FFI, Electron tooling. |
| **error-handling-auditor** | Error propagation, user messages, resilience; error-handling-patterns. |
| **commit-gate** | Atomic commits, conventional format, quality gates; commit skill; /commit. |
| **ai-feature-builder** | Chat, Agent, model routing, tools, MCP; ai-sdk skill. |
| **test-writer** | Writing unit/integration tests, TDD, coverage; test-forge, test-suite, vitest. |
| **verification-runner** | Full gate before "done"; verifier checklist, verification-before-completion. |
| **literal-consolidator** | Magic numbers, duplicated strings → constants/enums; literal-hunter. |

## Rules

- **fixing-workflow** — Process for resolving lint/type/test/E2E failures (discover all → task list → fix one-by-one → full suite).
- **code-style** — Type safety, file/function limits, logging, naming, conventions.

See `.cursor/rules/README.md` for rule file format.

## MCP

MCP servers are configured in `.cursor/mcp.json`. Adjust per project.
