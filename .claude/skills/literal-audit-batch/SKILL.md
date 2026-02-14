---
name: literal-audit-batch
description: Orchestrates literal audit work across multiple @simpill utils packages. Use when asked to tackle multiple packages, work through the literal audit todo list, or run the audit in batches.
---

# Literal Audit Batch / Orchestrator

You coordinate literal centralization across **multiple** packages from the audit. You do not do the edits yourself for every package in one go; you either work one package at a time using the executor workflow, or you assign a clear order and scope so sub-agents (or follow-up turns) can execute per package.

## When to use

- User says: "tackle the next 5 packages", "work through the literal audit todos", "run the audit in batches"
- User wants to split work across multiple agents or sessions
- User asks for a "batch" or "orchestration" plan for the literal audit

## Strategy

1. **Read the todo list**
   - Literal audit todos are per package (e.g. "Centralize literals in @simpill/env.utils").
   - Identify which are still pending.

2. **Choose batch size and order**
   - **Suggested order**: start with smaller/fewer-findings packages to build momentum (e.g. uuid.utils, adapters.utils) or by dependency order if relevant.
   - **Batch size**: 1 package per sub-agent invocation is safest. For "next 5 packages", output 5 concrete tasks (package names) and either execute the first one fully and list the next 4 for follow-up, or list all 5 with clear "Task 1: … Task 2: …" so the user can assign them.

3. **Per-package execution**
   - For each package in the batch, follow the **literal-audit-executor** workflow:
     - Open `docs/LITERAL_AUDIT_FINDINGS.md` → find `### {package}`.
     - Add constants to `utils/{package}/src/shared/constants.ts` (or enums as recommended).
     - Replace usages in files listed under "Files with findings".
     - Run tests and typecheck for that package.
   - If the user asked for "multiple packages" in one turn, either:
     - **Option A**: Complete one package fully, then report "Next: do X.utils" for the next agent/turn; or
     - **Option B**: Complete as many packages as context allows, then list remaining packages for the next run.

4. **Progress and handoff**
   - After each package: mark that todo complete (if you have access to the todo tool) or state "Completed: env.utils. Remaining: …".
   - For handoff: "To continue, run the literal audit executor for: annotations.utils, api.utils, …".

## Package order suggestion (by approximate effort)

- **Quick wins (fewer findings)**: uuid.utils, adapters.utils, annotations.utils, middleware.utils, factories.utils, file.utils, socket.utils, events.utils, errors.utils.
- **Medium**: env.utils, object.utils, string.utils, http.utils, request-context.utils, patterns.utils, resilience.utils, enum.utils, data.utils, crypto.utils, function.utils, test.utils.
- **Larger**: api.utils, logger.utils, time.utils, cache.utils, collections.utils, async.utils, misc.utils.
- **Largest**: token-optimizer.utils.

## Output format

- Start with: "Batch: [list of package names]. Doing package 1: {name}."
- For each completed package: "Done: {package}. Tests: pass/fail. Next: {next package}."
- End with: "Remaining: [list]" or "All requested packages done."

## Integration with executor

If the user has the **literal-audit-executor** skill, any agent can run it with: "Execute literal audit for {package}.utils." The batch skill helps decide *which* packages to do and in what order; the executor skill defines *how* to do one package.
