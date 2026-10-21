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

Internal packages export TypeScript source directly (`"exports": "./src/index.ts"`); there is no separate package build step.

## Working style

- One phase at a time. Each phase ends with something runnable and an agreed exit check.
- When a phase item is done, tick it in `PHASES.md`. When a decision is made, record it in `DECISIONS.md` with the reason.
- `packages/schema` is the contract. Changes to it need a `schemaVersion` consideration and tests.
- Status is derived from tracker state, never stored in the scene (D-12).
- The AI composes scenes from theme assets; it never generates meshes (D-11).
