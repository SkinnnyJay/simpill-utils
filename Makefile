# @simpill monorepo – run from repo root
# Utils: packages under utils/@simpill-*.utils (Jest, Biome, tsc)
# Sandbox: sandbox/todo-app (Next.js, Playwright E2E)

SHELL := /bin/bash
REPO_ROOT := $(shell cd "$(dirname "$0")" && pwd)

.PHONY: help \
	utils-build utils-test utils-lint utils-typecheck utils-format utils-check-fix utils-verify \
	sandbox-dev sandbox-build sandbox-e2e sandbox-lint sandbox-typecheck \
	verify

## -------- Meta --------

help:
	@echo "Available make targets (run from repo root):"
	@echo ""
	@echo "  Utils (utils/@simpill-*.utils – build/test/lint/typecheck/format):"
	@echo "    make utils-build      - Build all util packages (tsc)"
	@echo "    make utils-test       - Run tests in all util packages (Jest)"
	@echo "    make utils-lint       - Lint all util packages (Biome)"
	@echo "    make utils-typecheck  - Typecheck all util packages (tsc --noEmit)"
	@echo "    make utils-format     - Format all util packages (Biome)"
	@echo "    make utils-check-fix  - Lint + format with fix in all util packages"
	@echo "    make utils-verify     - Build + test all util packages (scripts/verify-all-utils.sh)"
	@echo ""
	@echo "  Sandbox (sandbox/todo-app – Next.js):"
	@echo "    make sandbox-dev     - Start Next.js dev server"
	@echo "    make sandbox-build   - Production build"
	@echo "    make sandbox-lint    - ESLint"
	@echo "    make sandbox-typecheck - TypeScript (tsc --noEmit)"
	@echo "    make sandbox-e2e     - Run Playwright E2E tests"
	@echo ""
	@echo "  Aggregate:"
	@echo "    make verify          - Same as utils-verify (full utils build + test)"
	@echo ""
	@echo "  Single package: cd utils/@simpill-<name>.utils && npm run build|test|lint|typecheck|verify"

## -------- Utils (utils/@simpill-*.utils) --------

utils-build:
	@echo ">>> Building all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm run build --silent) || exit 1; \
	done
	@echo ">>> utils-build done."

utils-test:
	@echo ">>> Running tests in all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm test --silent) || exit 1; \
	done
	@echo ">>> utils-test done."

utils-lint:
	@echo ">>> Linting all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm run lint --silent) || exit 1; \
	done
	@echo ">>> utils-lint done."

utils-typecheck:
	@echo ">>> Typechecking all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm run typecheck --silent) || exit 1; \
	done
	@echo ">>> utils-typecheck done."

utils-format:
	@echo ">>> Formatting all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm run format --silent) || exit 1; \
	done
	@echo ">>> utils-format done."

utils-check-fix:
	@echo ">>> Lint + format (with fix) in all util packages..."
	@for d in $(REPO_ROOT)/utils/@simpill-*.utils; do \
		name=$$(basename "$$d"); \
		echo "  $$name..."; \
		(cd "$$d" && npm run check:fix --silent) || exit 1; \
	done
	@echo ">>> utils-check-fix done."

utils-verify:
	@echo ">>> Verifying all util packages (build + test)..."
	@$(REPO_ROOT)/scripts/verify-all-utils.sh

verify: utils-verify

## -------- Sandbox (sandbox/todo-app) --------

sandbox-dev:
	@echo ">>> Starting Next.js dev server (sandbox/todo-app)..."
	@cd $(REPO_ROOT)/sandbox/todo-app && npm run dev

sandbox-build:
	@echo ">>> Building sandbox/todo-app..."
	@cd $(REPO_ROOT)/sandbox/todo-app && npm run build

sandbox-lint:
	@echo ">>> Linting sandbox/todo-app..."
	@cd $(REPO_ROOT)/sandbox/todo-app && npm run lint

sandbox-typecheck:
	@echo ">>> Typechecking sandbox/todo-app..."
	@cd $(REPO_ROOT)/sandbox/todo-app && npx tsc --noEmit

sandbox-e2e:
	@echo ">>> Running Playwright E2E (sandbox/todo-app)..."
	@cd $(REPO_ROOT)/sandbox/todo-app && npm run test:e2e
