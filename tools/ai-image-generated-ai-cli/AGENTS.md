# AGENTS.md

Project: IsoDOOM (TypeScript, web-first)

## Agent Focus Areas

- **WAD + Level compiler:** WAD directory/lump parsing, map → sectors/linedefs/things, level compiler output (level.json, geometry, collision, nav).
- **Simulation:** Fixed-timestep ECS (e.g. bitECS), movement, collision, combat (hitscan/projectile), AI (chase/attack), triggers (doors, exits).
- **Renderer:** Orthographic isometric camera (Three.js or Babylon.js), static geometry (floors/walls), entity rendering (voxel GLB or sprites), depth/occlusion.
- **Asset pipeline:** Prompt library and style guide, nano-banana sprite sheets, SpriteToVoxel → .vox, GLB export and metadata validation; pivot/collision/anim specs.
- **Web UI:** Next.js App Router, React, shadcn/ui for HUD and menus; Zustand for game state; follow Next.js best practices and avoid mixing hot game loop with React render.
- **Audio:** SFX and music from free/default content; spatial panning from camera/player position.

## Task Checklist

- Confirm the task in `PLAN.md` and note the scope.
- Review `PRD.md`, `PLAN.md`, and `HISTORY.md` before making changes.
- Review research and reference docs: `scratchpad/IsoDOOM_PRD.md`, `scratchpad/IsoDOOM_ENG.md`,
  `scratchpad/IsoDOOM_PLAN.md`, `scratchpad/RESEARCH_01.md`, `scratchpad/RESEARCH_03.md`,
  `scratchpad/RESOURCE_02.md`, `scratchpad/RESOURCES.md`, and `FINDINGS.md` when relevant.
- Keep deterministic sim rules: fixed tick, seeded RNG where used, replay-friendly design.
- Enforce strict typing and Zod validation at boundaries (level data, asset meta, config).
- Add or update tests for determinism, level compiler outputs, and asset validation.
- Record changes in `HISTORY.md` when the task completes.
- Continue until all tasks in `PLAN.md` are complete (do not stop early).

## Skills to Use

- **Game design and engine patterns:** `.cursor/skills/game-development`; `.cursor/skills/game-development/web-games` for browser/Three.js/WebGPU and asset strategy.
- **Pixel art and sprites:** `.cursor/skills/pixel-art-sprites` for sprite sheets, palettes, and pipeline consistency.
- **Next.js:** `.cursor/skills/next-best-practices` for file conventions, RSC, data patterns, and bundling.
- **UI:** shadcn/ui (Tailwind, CSS variables); use only needed components.

## Commands (when available)

- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- Web: `make web-install`, `make web-dev`, `make web-test`
