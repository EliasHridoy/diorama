# CLAUDE.md

Guidance for Claude Code sessions in this repo.

## Read first

- `plot.md`: what Diorama is (vision, concepts, architecture, scene schema)
- `PHASES.md`: build order. Work only on the current phase unless asked
- `DECISIONS.md`: settled vs open choices. Don't silently decide an open one; propose and ask

## Commands

- `pnpm dev`: run the web app
- `pnpm check`: typecheck, lint, format check, test, build (same as CI). Run before every commit
- `pnpm format`: apply Prettier
- `pnpm --filter @diorama/schema gen:json-schema`: regenerate `scene.schema.json` after changing the Zod schema (a test fails if it is stale)

Internal packages export TypeScript source directly (`"exports": "./src/index.ts"`); there is no separate package build step.

## Working style

- One phase at a time. Each phase ends with something runnable and an agreed exit check.
- When a phase item is done, tick it in `PHASES.md`. When a decision is made, record it in `DECISIONS.md` with the reason.
- `packages/schema` is the contract. Changes to it need a `schemaVersion` consideration and tests.
- Status is derived from tracker state, never stored in the scene (D-12).
- The AI composes scenes from theme assets; it never generates meshes (D-11).
- Viewer labels go through `LabelOverlay` / `LabelProjector` (one DOM layer), not drei `<Html>`: `<Html>` makes a React root per label and loses labels under React 19 StrictMode.
- Animate three.js objects through a small class (see `PartAnimator`) rather than mutating `useState`/`useMemo` values in `useFrame`; the React Compiler lint rules reject the latter.
- To see the viewer headless: run the dev server and screenshot with Playwright + `/usr/bin/google-chrome --use-angle=swiftshader`.
