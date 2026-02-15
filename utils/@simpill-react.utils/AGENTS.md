# @simpill/react.utils – Agent guidelines

## Structure

- **src/client/** – Hooks and React-specific code (useLatest, createSafeContext, useStableCallback, useLazyState, useDeferredUpdate).
- **src/shared/** – Types (ReactNode, ComponentType, RefObject) and runtime-agnostic helpers.
- **src/server/** – Reserved for future RSC-related types or helpers.
- **__tests__/client/unit/** – Unit tests for hooks (renderHook, act).
- **__tests__/shared/unit/** – Unit tests for shared types.

## Conventions

- Framework-agnostic: no Next.js or framework-specific code in core hooks.
- Follow Vercel/React patterns: lazy state init, useLatest for stable refs, startTransition for non-urgent updates.
- Use strict TypeScript; hooks must work with React 18+.
- 400 lines max per file.

## Testing

- Use `@testing-library/react` (renderHook, act) for hooks; testEnvironment jsdom.
- Unit test all public hooks and factories; maintain 80%+ coverage.
- No Next.js in tests.
