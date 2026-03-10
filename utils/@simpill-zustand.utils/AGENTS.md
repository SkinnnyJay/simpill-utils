# @simpill/zustand.utils – Agent guidelines

- **Structure**: `src/shared` (store factory, slices, types); `src/client` for persist (localStorage/sessionStorage) and devtools; `src/server` for in-memory fallback if needed.
- **Tests**: `__tests__/shared/unit/`, `__tests__/client/unit/` (and integration where applicable).
- **Style**: Biome, 2 spaces, 100-char line, strict TypeScript. Max 400 lines per file.
- **Zustand**: Peer is zustand v4/v5; avoid React-specific APIs in shared so it can be used in non-React runtimes if desired.
