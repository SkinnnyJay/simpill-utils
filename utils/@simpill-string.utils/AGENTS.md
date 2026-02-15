# Repository Guidelines

## Project Structure
- `src/` contains TypeScript sources. Runtime-specific modules live in `src/client/` and `src/server/`,
  with shared helpers in `src/shared/`. Public exports are wired through `src/index.ts`.
- `__tests__/` mirrors the runtime split (`client`, `server`, `shared`) with `unit/` suites.
- `scripts/` contains checks and git hooks; `dist/` and `coverage/` are generated artifacts.

## Commands
- `npm run build`: compile TypeScript to `dist/`.
- `npm test`: run Jest once.
- `npm run test:coverage`: generate coverage reports in `coverage/`.
- `npm run lint`, `npm run format`, `npm run check`: Biome linting/formatting.
- `npm run verify`: format check, lint, typecheck, tests, build.

## Code Style
- TypeScript strict mode; avoid widening types.
- Biome enforces 2-space indentation, double quotes, semicolons, 100-char lines.
- Keep files under 400 lines; split if needed.

## Testing
- Jest + `ts-jest` with tests under `__tests__/`.
- Naming: `*.unit.test.ts` and `*.integration.test.ts`.
- Add tests for new public APIs in the matching runtime folder.

## Docs
- Update `README.md` when public exports change.
