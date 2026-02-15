---
name: Todo App React Next Shadcn
overview: Build a minimal, futuristic todo app in sandbox/todo-app using only React 19, Next.js 15, Shadcn UI, and the monorepo's utils packages. All business logic stays in the app; utils are consumed as-is. Patterns and missing utilities discovered during build will be implemented in utils with full autonomy (new or extended packages).
todos: []
isProject: false
---

# Futuristic Todo App – React + Next.js + Shadcn (Sandbox)

## Goals

- **App**: Super minimal, futuristic UI with slick animations; full todo functionality (add, edit, delete, complete, filter) implemented with Shadcn and intent.
- **Scope**: All app code and launch config live under [sandbox/todo-app/](sandbox/todo-app/). No todo-specific or business logic in [utils/](utils/).
- **Utils**: Use **only** existing `@simpill/*` packages. While building, surface patterns or missing helpers and implement them in utils with full autonomy (new or extended packages), keeping DX and reusability high and KISS.

---

## 1. Tech stack and versions

- **React 19** and **Next.js 15** (App Router), with dynamic APIs awaited where required (e.g. `params`, `searchParams`).
- **Shadcn UI**: Init via `npx shadcn@latest init` in the app; use CSS variables, Tailwind, and only the components the app needs (Button, Input, Checkbox, Card, Dialog, DropdownMenu, etc.).
- **Animations**: Prefer CSS (transform + opacity) for micro-interactions and list items; add a small animation library (e.g. Framer Motion or Motion) only if needed for enter/exit or reorder, and keep it lazy-loaded where possible.
- **Styling**: Tailwind + Shadcn theme; futuristic look via typography (e.g. Geist or similar), subtle gradients, glass/blur, and restrained motion.

---

## 2. App structure (sandbox/todo-app)

- **Scaffold**: Next.js 15 app with TypeScript, ESLint, Tailwind, `src/` and App Router. No Pages Router.
- **Layout**: Root layout with theme and font setup; a single main route (e.g. `/`) for the todo screen.
- **State**: Client-side only for MVP (no DB). Zustand store with **persist** (localStorage) for todos.
- **Data shape**: Each todo: `id`, `title`, `completed`, `createdAt` (and optionally `updatedAt`). All logic (reducers, filters, sorting) lives in the app.

```
sandbox/todo-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/     # Shadcn + app-specific UI
│   │   ├── ui/         # Shadcn components
│   │   ├── todo-list.tsx
│   │   ├── todo-item.tsx
│   │   ├── todo-form.tsx
│   │   └── todo-filters.tsx
│   ├── store/         # Zustand store and slices
│   ├── lib/           # App-only helpers (e.g. todo schema, form defaults)
│   └── actions/       # Optional server actions (if any)
├── package.json       # Deps: next, react, @simpill/* via file:../../utils/...
├── components.json   # Shadcn
├── tailwind.config.ts
└── tsconfig.json
```

- **Launch**: `npm run dev` from `sandbox/todo-app` must start the app. Dependencies on utils via `file:../../utils/<name>.utils` (or workspace if present).

---

## 3. Todo features (all in app, using Shadcn + utils)


| Feature                           | Implementation                                  | Utils used                                                                                               |
| --------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Add todo                          | Form + Shadcn Input/Button; validation with Zod | `@simpill/uuid.utils`, `@simpill/zod.utils`, `@simpill/data.utils` (e.g. addCreatedAt)                   |
| Toggle complete                   | Checkbox + store update                         | `@simpill/array.utils` (e.g. for derived lists), store in app                                            |
| Edit todo                         | Inline or dialog edit; optimistic update        | `@simpill/data.utils` (touchUpdatedAt if used), `@simpill/function.utils` (debounce for save if desired) |
| Delete todo                       | Button + confirmation (Dialog or dropdown)      | Store logic in app                                                                                       |
| Filter (All / Active / Completed) | Tabs or segmented control (Shadcn)              | `@simpill/array.utils` (partition, filter)                                                               |
| Clear completed                   | Single action + confirmation                    | Store logic in app                                                                                       |
| Persist across reloads            | Zustand persist middleware                      | `@simpill/zustand.utils` (createAppStore, withPersist)                                                   |


- **Validation**: Define a small Zod schema in the app (e.g. `todoSchema`, `addTodoSchema`); use `safeParseResult` / `flattenZodError` from `@simpill/zod.utils` for form or action validation.
- **IDs**: Generate with `generateUUID()` from `@simpill/uuid.utils`.
- **Timestamps**: Use `addCreatedAt` / `touchUpdatedAt` from `@simpill/data.utils` if the app model includes them.
- **Stable callbacks / transitions**: Use `useStableCallback`, `useDeferredUpdate`, or `useLatest` from `@simpill/react.utils` where they reduce re-renders or improve UX (e.g. filter changes with `startTransition`).

---

## 4. Utils packages to consume (no biz logic in utils)

- **@simpill/zustand.utils** – `createAppStore`, `withPersist`, `createSlice`, persist options (localStorage).
- **@simpill/uuid.utils** – `generateUUID`.
- **@simpill/array.utils** – `partition`, `filter`, `sortBy`, `uniqueBy`, etc., for derived lists and filters.
- **@simpill/data.utils** – `deepClone`, `addCreatedAt`, `touchUpdatedAt`, `pickKeys`, etc.
- **@simpill/zod.utils** – Zod schemas, `safeParseResult`, `flattenZodError`, schema builders as needed.
- **@simpill/react.utils** – `useStableCallback`, `useDeferredUpdate`, `useLatest` (and `createSafeContext` if a shared context is added).
- **@simpill/nextjs.utils** – Optional: `createSafeAction`, `ActionResult` if server actions are introduced later.
- **@simpill/errors.utils** – Optional: `serializeError` / `AppError` if server actions return errors.
- **@simpill/function.utils** – Optional: `debounce` for search or delayed save.
- **@simpill/time.utils** – Optional: date display or relative time if “due date” is added later.

No new packages are required to start; add or extend only when a clear, reusable pattern emerges.

---

## 5. Discovering and implementing utils improvements

While building the app:

- **Patterns to watch**: Optimistic updates, list key stability, persist rehydration (loading state), filter state + transitions, form validation with Zod, accessibility of Shadcn components.
- **If something is missing**: Implement it in the appropriate utils package (or a new one) with full autonomy: add tests, document, keep shared code in `shared/` and runtime-specific in `client/`/`server/` per [CONTRIBUTING.md](CONTRIBUTING.md). Prefer small, focused additions (e.g. a single helper or hook) over large new packages.
- **Examples of possible additions** (only if needed and clearly reusable):
  - **react.utils**: e.g. `useOptimistic`-style helper or a tiny `usePersistRehydrated` if rehydration UX becomes a repeated pattern.
  - **array.utils**: already rich; add only if a concrete need appears (e.g. a small `replaceBy` or `updateBy`).
  - **data.utils**: already has lifecycle helpers; extend only if a new shared primitive appears (e.g. a generic “patch with timestamps”).
  - **zustand.utils**: ensure persist + devtools docs and types are clear; add migration/version support only if the app needs it.

All such work must stay generic and not contain todo-specific logic.

---

## 6. Design and animation direction

- **Visual**: Minimal, futuristic – clean typography, ample whitespace, subtle borders or glass panels, dark or light theme with a distinct accent (e.g. cyan/blue or soft purple). Use Shadcn’s theming (CSS variables) for consistency.
- **Motion**: Prefer CSS transitions for hover, focus, and toggle (transform/opacity). Use `content-visibility: auto` or similar for long lists if needed. For enter/exit or reorder, consider a small, lazy-loaded animation lib and keep animations short (200–400 ms).
- **A11y**: Rely on Shadcn’s semantics and ARIA; ensure focus order, labels, and keyboard support for add/edit/delete/filter.

---

## 7. Implementation order (high level)

1. **Scaffold** – Create [sandbox/todo-app/](sandbox/todo-app/) with Next.js 15, React 19, TypeScript, Tailwind; add Shadcn init and globals.
2. **Dependencies** – Add `@simpill/*` deps via `file:../../utils/<name>.utils`; ensure utils are built (`npm run build` in each used package) and that the app builds and runs.
3. **Store** – Implement Zustand store (todos array, actions: add, toggle, update, delete, clear completed) with persist using `@simpill/zustand.utils`.
4. **Core UI** – Implement add form, todo list, todo item (checkbox, title, edit/delete), and filters using Shadcn components and app components only.
5. **Validation and IDs** – Wire Zod schema(s) and `generateUUID` / data.utils lifecycle where applicable.
6. **Polish** – Theming, typography, and CSS (and optional JS) animations; accessibility pass.
7. **Utils feedback** – Document and implement any new or extended utils that emerged; ensure tests and CONTRIBUTING compliance.

---

## 8. Success criteria

- App runs from `sandbox/todo-app` with `npm run dev`.
- All basic todo features work (add, complete, edit, delete, filter, clear completed, persist).
- Only `@simpill/*` packages from [utils/](utils/) are used for logic and helpers; no business logic in utils.
- Any new or changed utils are generic, tested, and documented.
- UI is minimal, futuristic, and uses Shadcn with clear intent and smooth, performant animations.

---

## 9. Engine-agnostic server interfaces and new/extended packages

To **prove value** when building apps with this stack while staying **agnostic** across implementations (Fastify, Next.js, Express, etc.), introduce **standard interfaces** and **engine-specific adapters**. App and shared code depend on contracts; each “engine” implements the contract with clean, idiomatic code under the hood.

### 9.1 Where things stand today

- **[protocols.utils](utils/protocols.utils/)**: Correlation headers, env boolean parsing, log env keys. No server/request/response contracts.
- **[adapters.utils](utils/adapters.utils/)**: `CacheAdapter`, `LoggerAdapter`, `createAdapter` – good pattern for “interface + implementations.”
- **[nextjs.utils](utils/nextjs.utils/)**: `RequestLike`, `IResponseHelpers`, `MiddlewareFn`, `INextApp` – request/response are Web-like; middleware is Next-centric.
- **[middleware.utils](utils/middleware.utils/)**: Generic `Middleware<Req, Res>` (req, res, next); `MiddlewareRequest` / `MiddlewareResponse` are minimal and engine-agnostic.
- **[api.utils](utils/api.utils/)**: `ApiRequestContext`, `ApiHandler(ctx) => result` – context-based, already engine-agnostic for typed API factories, but not the same as a pluggable HTTP server.

### 9.2 New or extended functionality (agnostic, clean code)

**A. Server protocol interfaces (new)**

Introduce **minimal, engine-agnostic** HTTP server contracts so that Express, Fastify, and Next.js can each implement them without leaking framework types:

- **IRequest** – `method`, `url`, `headers`, `body()`, `query` (or `searchParams`). Enough for handlers and middleware to read input.
- **IResponse** – `status(code)`, `json(data)`, `send(data)`, `setHeader(name, value)`. Enough to send responses without touching engine-specific APIs.
- **IRequestHandler** – `(req: IRequest, res: IResponse) => void | Promise<void>`. Shared handler signature across engines.
- **IWebServer** – `listen(port)`, `close()`, `use(middleware)`, `get(path, handler)`, `post(path, handler)`, etc. Optional: `mount(path, subApp)` if needed. Implementations wrap the real server (Express app, Fastify instance, or Next.js custom server / Route Handlers).

Place these in one of:

- **Extend [protocols.utils**](utils/protocols.utils/): Add e.g. `src/shared/http-server.ts` (or `server-protocol.ts`) exporting the above. Keeps all “contracts” in one package; no new package.
- **Or new package @simpill/server-protocol.utils**: If you prefer to keep protocols.utils to constants/correlation/env only, a thin package that only exports these types (no implementations) is an option.

Recommendation: **extend protocols.utils** with a single new file for server contracts so one place owns “what a server/request/response look like” and we avoid an extra package for four interfaces.

**B. Engine adapters (implement the protocol)**

Each engine gets a thin adapter that **implements** `IWebServer` (and maps native req/res to `IRequest`/`IResponse`):

- **[nextjs.utils](utils/nextjs.utils/)**: Add e.g. `createNextServerAdapter(options)` that returns `IWebServer` by wrapping Next.js Route Handlers or a minimal Node server using Next.js. Handlers registered via the adapter receive `IRequest`/`IResponse`; the adapter converts to/from Next.js `Request`/`Response` under the hood.
- **Future – express.utils**: New package (or subpath of a single “server-adapters” package). Exports `createExpressAdapter(app)` that returns `IWebServer`; wraps Express `req`/`res` into `IRequest`/`IResponse` and registers route handlers so Express runs them.
- **Future – fastify.utils**: Same idea: `createFastifyAdapter(fastifyInstance)` → `IWebServer`, wrapping Fastify request/reply into the protocol types.

Adapters stay thin: no business logic, only mapping and delegation to the engine. This keeps solutions agnostic and lets each implementation “take advantage of each engine” (e.g. Next.js streaming, Fastify schema validation, Express middleware ecosystem) while exposing one contract.

**C. Middleware alignment**

- **[middleware.utils](utils/middleware.utils/)**: Already has `Middleware<Req, Res>`. Document that when using server protocols, `Req = IRequest` and `Res = IResponse` from protocols.utils. Optionally add a type alias or a small helper that composes middleware over `(IRequest, IResponse, next)`. Same middleware can then run on any engine that provides `IRequest`/`IResponse` via its adapter.
- **nextjs.utils** `MiddlewareFn(request: RequestLike, next) => Response` can remain for Next-specific flows; the protocol-based middleware is for code that should be reusable across Express/Fastify/Next.

**D. How this proves value**

- **Todo app**: Can stay fully Next.js for the UI. To prove the pattern, add one Route Handler (or a small BFF route) whose **handler** is written against `IRequest`/`IResponse` and is invoked by the Next.js adapter that implements `IWebServer`. No engine swap required for the app, but the handler is portable.
- **Future apps**: An API-only or hybrid app can depend only on `IWebServer`, `IRequest`, `IResponse`, and `IRequestHandler`. Swapping from Next.js to Fastify or Express means swapping the adapter and wiring; business logic (validation with zod.utils, errors with errors.utils, etc.) stays unchanged.
- **Reusability**: Validation, error serialization, correlation, and logging can be implemented once against the protocol types and reused in every engine.

### 9.3 Implementation order (for this strategy)

1. **Protocols** – Add `IWebServer`, `IRequest`, `IResponse`, `IRequestHandler` to protocols.utils (single new file in `src/shared/`), re-export from main and `./shared`. No dependencies on Express/Fastify/Next.
2. **Next.js adapter** – In nextjs.utils, implement the adapter that maps Next.js Request/Response to the protocol and exposes `IWebServer` (e.g. over Route Handlers or a minimal custom server). Depends on protocols.utils.
3. **Optional: middleware.utils** – Add a short note or type alias that protocol-based middleware uses `IRequest`/`IResponse`; no breaking change.
4. **Todo app (or follow-up)** – Use the adapter in one route to show a handler written against `IRequest`/`IResponse`; keeps the app runnable and demonstrates the pattern.
5. **Later** – Add express.utils / fastify.utils only when there is a concrete need (e.g. a second app or internal tool using Express/Fastify); same interfaces, different adapter.

This keeps the stack **agnostic**, **clean**, and **reusable** while allowing each engine to be used in the most natural way under the hood.