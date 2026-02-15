# CLAUDE.md

You are working in **IsoDOOM**, an isometric-only DOOM-style game targeting the web (Next.js + React + shadcn/ui + Three.js/Babylon.js). Content defaults to Freedoom; BYO IWAD is optional. Asset pipeline uses AI-generated sprites and voxel conversion (e.g. SpriteToVoxel) to produce runtime GLB + metadata.

## Always Do

- Start from `PLAN.md` and take the next unchecked task.
- Review `PRD.md`, `PLAN.md`, and `HISTORY.md` before making changes.
- Review research and reference docs: `scratchpad/IsoDOOM_PRD.md`, `scratchpad/IsoDOOM_ENG.md`,
  `scratchpad/IsoDOOM_PLAN.md`, `scratchpad/RESEARCH_01.md`, `scratchpad/RESEARCH_03.md`,
  `scratchpad/RESOURCE_02.md`, `scratchpad/RESOURCES.md`, and `FINDINGS.md` when relevant.
- Keep simulation deterministic: fixed tick, seeded RNG, replay-friendly where applicable.
- Use strict TypeScript: no `any` or unsafe casts; validate boundaries with Zod (levels, assets, config).
- Preserve boundaries: sim core does not depend on renderer or UI; renderer consumes snapshots only.
- Update `HISTORY.md` when a task is completed.
- Continue until all tasks in `PLAN.md` are complete (do not stop early).
- For game logic and rendering: apply `.cursor/skills/game-development` and `game-development/web-games` patterns (fixed timestep, ECS, input abstraction, perf budget).
- For Next.js and UI: follow `.cursor/skills/next-best-practices`; use shadcn/ui and Tailwind for shell and HUD.
- For sprites and asset style: use `.cursor/skills/pixel-art-sprites` for consistency and pipeline-friendly art.

## Never Do

- Do not introduce nondeterministic APIs in sim code (except where explicitly opt-in).
- Do not log or persist proprietary/original IWAD asset contents.
- Do not bypass asset validation, hash checks, or WAD/mod size and bounds checks.
- Do not run untrusted mod content in the main thread without parsing in a worker and validating.

## Commands (when available)

- Monorepo: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- Web: `make web-install`, `make web-dev`, `make web-test` (or equivalent pnpm scripts)

## Reference Docs

- `README.md`, `PLAN.md`
- `scratchpad/IsoDOOM_PRD.md`, `scratchpad/IsoDOOM_ENG.md`, `scratchpad/IsoDOOM_PLAN.md`
- `scratchpad/RESEARCH_01.md`, `scratchpad/RESOURCE_02.md`, `scratchpad/RESEARCH_03.md`, `scratchpad/RESOURCES.md`
