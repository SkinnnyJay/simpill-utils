# .agents — Reference and toolchain skills

This directory holds **reference skills** for specific toolchains and frameworks (Vitest, shadcn, Next.js, Prisma, Vercel/React patterns, etc.). They are used when the agent needs deep, citeable guidance for a given stack.

## Purpose

- **Not duplicated in `.claude/skills/`** — Project skills (commit, code review, testing workflow) live in `.claude/skills/`. Here we keep larger, reference-style skills.
- **Stable, local context** — Prefer local Markdown over web scraping. These skills give agents deterministic, project-available docs.
- **One skill per folder** — Each skill has a `SKILL.md` (required) and optional `references/`, `rules/`, or other supporting files.

## Skill index

| Skill | Description |
|-------|-------------|
| **vitest** | Vitest test runner: config, API, mocking, coverage, concurrency. |
| **vercel-react-best-practices** | React/Vercel patterns: rendering, rerender, bundle, async, server rules. |
| **typescript-advanced-types** | Advanced TypeScript types and patterns. |
| **shadcn-ui** | shadcn/ui components and usage. |
| **tailwind-v4-shadcn** | Tailwind v4 with shadcn. |
| **prisma-expert** | Prisma schema, migrations, queries. |
| **nodejs-backend-patterns** | Node/backend patterns. |
| **nextjs-best-practices** | Next.js best practices. |
| **nextjs-app-router-patterns** | App Router patterns. |
| **modern-javascript-patterns** | Modern JS patterns (ES6+, async, modules). |
| **e2e-testing-patterns** | E2E testing patterns (Playwright, Cypress). |
| **audit-website** | Website audit workflow. |
| **systematic-debugging** | Root-cause-first debugging; no fixes before investigation (obra/superpowers). |
| **debugging-strategies** | Profiling, root-cause analysis across stacks. |
| **architecture-patterns** | Clean/Hexagonal/DDD; forking and evolving architecture. |
| **rust-async-patterns** | Rust async/concurrency (Tokio, async traits). |
| **error-handling-patterns** | Cross-language error propagation and resilience. |
| **monorepo-management** | Turborepo, Nx, pnpm workspaces; large monorepos. |
| **git-advanced-workflows** | Rebasing, bisect, worktrees; fork and upstream sync. |
| **ai-sdk** | Vercel AI SDK; model routing, Chat, tools (vercel/ai). |

## Format

Each skill’s `SKILL.md` should have:

- **Frontmatter:** `name`, `description` (third person; WHAT + WHEN).
- **Body:** Instructions, process, examples. Keep main file under ~500 lines; use references for deep material.
