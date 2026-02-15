# CODEX.md

Project: IsoDOOM (working title)
Languages: TypeScript (web-first) + optional Python (tools)

## Project Context

IsoDOOM is an isometric-only action game inspired by classic DOOM: same combat loop, key-door progression, and WAD-compatible level structure, rendered with an orthographic isometric camera. The web client uses Next.js, React, and shadcn/ui for the shell and HUD; the game view uses Three.js (or Babylon.js) with a fixed isometric projection. Asset pipeline: AI sprite sheets (e.g. nano-banana) → voxelization (e.g. SpriteToVoxel) → GLB + metadata, with validation at each step.

## Engineering Rules

- Determinism-first: fixed tick (e.g. 35 Hz), seeded RNG where used; replay/debug support.
- TypeScript strict: no `any` or unsafe casts; validate boundaries with Zod (level data, asset metadata, config).
- Asset pipeline: manifest + hash validation; rollback on install failure; provenance for generated assets.
- Renderer consumes draw/state snapshots only; sim core has no render or UI dependencies.
- Treat WADs and mods as untrusted: parse in worker, bounds checks, no eval or dynamic script from mods.
- Read `PRD.md`, `PLAN.md`, `HISTORY.md`, and the scratchpad research/docs before major changes.
- Do not stop until all tasks in `PLAN.md` are complete.

## Architecture Boundaries

- **WAD / Level compiler:** Parse IWAD/PWAD, emit level.json + geometry/collision/nav; no game logic.
- **Sim core:** Fixed-timestep ECS (e.g. bitECS); input → movement, collision, combat, AI, triggers.
- **Renderer:** Orthographic isometric camera; consumes ECS snapshots; floors/walls/entities; no sim mutation.
- **Asset pipeline:** Prompts → sprites → voxel → GLB + meta; validation and CI gates.
- **Web UI:** Next.js App Router; shadcn/ui for HUD and menus; Zustand for game state bound to UI.

## Testing and Quality

- Unit/integration tests for sim rules, determinism, and level compiler.
- Golden map tests: compile fixed maps, verify deterministic outputs.
- Asset pipeline tests: schema validation, GLB load, atlas size and pivot checks.
- Perf budgets: draw calls, triangles in view, texture atlas size; 60 fps target on mid-range laptops.

## Commands (when available)

- `make install` (or pnpm install in monorepo)
- `make lint` / `make typecheck` / `make test` / `make build`
- `make web-install` / `make web-dev` / `make web-test`

## Skills and Tools

- **Game development:** `.cursor/skills/game-development` (orchestrator); `.cursor/skills/game-development/web-games` for browser/Three.js/WebGPU.
- **Pixel art / sprites:** `.cursor/skills/pixel-art-sprites` for sprite sheets, palettes, animation, and asset pipeline consistency.
- **Next.js:** `.cursor/skills/next-best-practices` for App Router, RSC, data patterns, and bundling.
- **UI:** shadcn/ui with Tailwind and CSS variables; use only components the app needs.
- Keep `PLAN.md` and `HISTORY.md` in sync with changes.

## Key Docs

- `PLAN.md` (execution plan)
- `README.md`
- `scratchpad/IsoDOOM_PRD.md` (product requirements)
- `scratchpad/IsoDOOM_ENG.md` (engineering design)
- `scratchpad/IsoDOOM_PLAN.md` (milestones)
- `scratchpad/RESEARCH_01.md`, `scratchpad/RESOURCE_02.md`, `scratchpad/RESEARCH_03.md` (research and references)
- `scratchpad/RESOURCES.md`, `scratchpad/CODE-QUALITY-AUDIT.md`, `FINDINGS.md`
