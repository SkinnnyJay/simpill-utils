# @simpill/zod.utils – Agent guidelines

- **Structure**: `src/shared` (schema builders, safe-parse, transforms, openapi helpers), `src/client` / `src/server` only if runtime-specific.
- **Tests**: `__tests__/shared/unit/` and `__tests__/shared/integration/`; mirror src layout.
- **Style**: Biome, 2 spaces, 100-char line, strict TypeScript. Max 400 lines per file.
- **OpenAPI**: Keep zod-openapi as optional peer; helpers should degrade when not installed.
