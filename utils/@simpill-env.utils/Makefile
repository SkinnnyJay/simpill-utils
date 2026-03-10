.PHONY: all install build test test-watch coverage lint lint-fix format format-check check check-fix typecheck verify clean help

all: verify

install:
	npm ci

build:
	npm run build

test:
	npm test

test-watch:
	npm run test:watch

coverage:
	npm run test:coverage

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

format-check:
	npm run format:check

check:
	npm run check

check-fix:
	npm run check:fix

typecheck:
	npx tsc --noEmit

verify: format-check lint typecheck test build
	@echo "All checks passed."

clean:
	rm -rf dist coverage node_modules/.cache

distclean: clean
	rm -rf node_modules

help:
	@echo "env.utils"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install       Install dependencies"
	@echo "  build         Compile TypeScript to dist/"
	@echo "  test          Run tests"
	@echo "  test-watch    Run tests in watch mode"
	@echo "  coverage      Run tests with coverage report"
	@echo "  lint          Check for lint errors"
	@echo "  lint-fix      Fix lint errors"
	@echo "  format        Format code"
	@echo "  format-check  Check code formatting"
	@echo "  check         Run biome check"
	@echo "  check-fix     Fix biome issues"
	@echo "  typecheck     Run TypeScript type checking"
	@echo "  verify        Run all checks (default)"
	@echo "  clean         Remove build artifacts"
	@echo "  distclean     Remove all generated files"
	@echo "  help          Show this help"
