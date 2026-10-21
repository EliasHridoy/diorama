# Contributing

Thanks for your interest in Diorama! The project is early. Read [plot.md](plot.md) for the idea and [PHASES.md](PHASES.md) for what's being built right now.

## Setup

Requires Node 22.12+ (24 recommended, see `.nvmrc`) and pnpm 9.

```sh
pnpm install
pnpm dev     # start the web app
pnpm check   # typecheck, lint, format check, test, build (what CI runs)
```

## Layout

```
apps/web          3D viewer (Vite + React + React Three Fiber)
packages/schema   Scene schema: types, validation, status derivation
```

More packages (`themes`, `connectors`, `agent`) are added as their phase starts.

## Pull requests

- Keep PRs focused on one phase item.
- `pnpm check` must pass.
- Changes to `packages/schema` need tests and a thought about `SCHEMA_VERSION`.
- Open design questions go in [DECISIONS.md](DECISIONS.md).
