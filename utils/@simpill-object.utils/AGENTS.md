# @simpill/object.utils – Agent guidelines

## Structure

- **src/shared/** – Runtime-agnostic object types and helpers (guards, get/set, pick/omit, merge, immutable, create).
- **src/client** and **src/server** – Re-export shared; add runtime-specific code here if needed later.
- **__tests__/shared/unit/** – Unit tests for shared modules.

## Conventions

- Keep helpers pure and side-effect free where possible; document mutation (e.g. `setByPath`, `defineReadOnly`).
- Use strict TypeScript; prefer type-safe pick/omit and path helpers.
- New utilities belong in `shared/` unless they require Node or browser APIs.
- File size limit 400 lines; split by concern (e.g. types, guards, get-set, pick-omit, merge, immutable, create).

## Testing

- Unit test all public functions; maintain 80%+ coverage.
- Test edge cases: empty path, missing keys, nested objects, arrays in merge.
