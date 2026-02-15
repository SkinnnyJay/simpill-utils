# Cursor rules

Rules in this directory are **Cursor rules** (`.mdc` files with YAML frontmatter). They provide persistent context for the AI agent.

## File format

- **Extension:** `.mdc`
- **Location:** `.cursor/rules/`
- **Frontmatter:** YAML at the top of each file.

## Frontmatter fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Brief description (shown in rule picker). |
| `globs` | string | File pattern; rule applies when matching files are open. Omit for always-apply. |
| `alwaysApply` | boolean | If `true`, applies to every conversation. |

## Examples

**Always apply:**

```yaml
---
description: Workflow for fixing lint, type, test, and E2E failures
alwaysApply: true
---
```

**File-scoped:**

```yaml
---
description: TypeScript conventions for this project
globs: "**/*.ts"
alwaysApply: false
---
```

## Best practices

- Keep rules **concise** (under ~50 lines when possible; one concern per rule).
- Use **actionable** language and concrete examples.
- Prefer **alwaysApply** for global workflow and quality standards; use **globs** for language or path-specific conventions.
