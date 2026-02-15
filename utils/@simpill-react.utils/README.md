# @simpill/react.utils

Framework-agnostic React utilities: hooks, safe context, stable callbacks, and transition helpers.

## Installation

```bash
npm install @simpill/react.utils
```

## Usage

### Subpath exports

```ts
import { useLatest, createSafeContext } from "@simpill/react.utils";
import { useLatest } from "@simpill/react.utils/client";
import type { ReactNode } from "@simpill/react.utils/shared";
```

### useLatest

Ref that always holds the latest value; avoids stale closures without adding effect deps.

```tsx
const onSearchRef = useLatest(onSearch);
useEffect(() => {
  const t = setTimeout(() => onSearchRef.current(query), 300);
  return () => clearTimeout(t);
}, [query]);
```

### createSafeContext / useSafeContext

Context that throws if used outside the provider.

```tsx
const { Provider, useCtx } = createSafeContext<AuthState>("Auth");

function App() {
  return (
    <Provider value={authState}>
      <Profile />
    </Provider>
  );
}

function Profile() {
  const auth = useCtx();
  return <div>{auth.user.name}</div>;
}
```

### useStableCallback

Stable function reference that always calls the latest callback (for effects that shouldn’t re-subscribe).

```tsx
const onResize = useStableCallback(() => setWidth(window.innerWidth));
useEffect(() => {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []); // no onResize in deps
```

### useLazyState

Typed lazy `useState(initializer)` so expensive init runs only once.

```tsx
const [index, setIndex] = useLazyState(() => buildSearchIndex(items));
```

### useDeferredUpdate

State setter that wraps updates in `startTransition` for non-urgent updates.

```tsx
const [scrollY, setScrollY] = useDeferredUpdate(0);
useEffect(() => {
  const handler = () => setScrollY(window.scrollY);
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}, []);
```

## API

| Export | Description |
|--------|-------------|
| `useLatest(value)` | Ref that always holds latest value |
| `createSafeContext(displayName?)` | `{ Provider, useCtx }`; useCtx throws outside provider |
| `useSafeContext(context)` | Hook that throws if context is null |
| `useStableCallback(fn)` | Stable callback that invokes latest fn |
| `useLazyState(initializer)` | Lazy useState initializer |
| `useDeferredUpdate(initial)` | [state, setState] with setState in startTransition |

### What we don't provide

- **State management** — No global store or Redux-style reducer; use **useState**, **useReducer**, or a store library (e.g. Zustand).
- **Data fetching** — No **useSWR**, **useQuery**, or cache; use React Query, SWR, or fetch in **useEffect** / server components.
- **Routing** — No router; use Next.js, React Router, or your framework’s router.
- **Component library** — Hooks and context only; no UI components.

## Development

From `utils/react.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## License

ISC
