# Decisions

A running log of choices. **Open** = needs your call (my recommendation is given). **Decided** = settled; change it by editing here with a reason.

| ID   | Topic                              | Status                       | Needed by   |
| ---- | ---------------------------------- | ---------------------------- | ----------- |
| D-01 | Monorepo tooling                   | Decided (pnpm workspaces)    | —           |
| D-02 | Web framework                      | Decided (Vite + React + R3F) | —           |
| D-03 | Backend shape                      | Open                         | Phase 4     |
| D-04 | License                            | Decided (MIT, changeable)    | —           |
| D-05 | GitHub auth                        | Open                         | Phase 4 / 6 |
| D-06 | Where the scene lives              | Open                         | Phase 4     |
| D-07 | Art style & assets                 | Open                         | Phase 2     |
| D-08 | LLM key & cost model               | Open                         | Phase 5     |
| D-09 | Hosting                            | Open                         | Phase 6     |
| D-10 | Product-first or research-first    | Decided (research-first)     | —           |
| D-11 | The AI does not generate 3D meshes | Decided                      | —           |
| D-12 | Status is derived, never stored    | Decided                      | —           |
| D-13 | Cross-theme common kit             | Decided                      | —           |

---

### D-01 — Monorepo tooling · Decided: pnpm workspaces

One monorepo with pnpm workspaces. Add Turborepo later only if builds get slow. Nx is overkill here.

### D-02 — Web framework & renderer · Decided: Vite + React + React Three Fiber (three.js)

- **Why not Next.js:** the 3D canvas is entirely client-side, so SSR/RSC adds friction and no benefit.
- **Why not Rust (Bevy/wgpu → WASM) for now:** three.js and Bevy both draw through the browser's WebGL/WebGPU, and a diorama of a few hundred objects is limited by the GPU, not by JavaScript. Rust would bring a bigger first download (several MB of WASM), slower iteration, fewer ready-made tools and fewer contributors. That's a bad trade for a research tool that participants open from a link.
- **Rust stays possible:** the scene format is language-neutral (JSON Schema), so a Bevy viewer could be added later. If profiling finds a CPU hot spot (layout of huge scenes, thousands of flow particles), that piece can be written in Rust → WASM and called from TS.

### D-03 — Backend shape · Open

- **Options:**
  - a) **No backend for MVP-dev:** browser talks to GitHub API with a token, scene lives in the repo (D-06), LLM called with a BYO key.
  - b) Small Node server (Hono or Fastify) in `apps/server`: connectors, agent, webhooks, SSE.
- **Recommendation:** start with **(a)** through Phase 4, add **(b)** in Phase 5–6 when we need webhooks, OAuth secrets and server-side LLM calls. Keep connector/agent code in `packages/` so it runs in either place.

### D-04 — License · Decided: MIT

MIT is the most permissive and common for dev tools. Switch to Apache-2.0 if you want an explicit patent grant. Change it now rather than later, before outside contributions arrive.

### D-05 — GitHub auth · Open

- **Options:** Personal access token (dev) → OAuth App → GitHub App
- **Recommendation:** PAT in Phase 4, **GitHub App** in Phase 6. A GitHub App gets per-repo installs, webhooks out of the box and higher rate limits. That fits "pick a repo" better than an OAuth App.

### D-06 — Where the scene lives · Open

- **Options:** In a database on our server · As `.diorama/scene.json` inside the user's repo · Both (repo = source of truth, DB = cache)
- **Recommendation:** **In the repo.** It's versioned, diffable in PRs, works with zero infrastructure, fits open source culture, and gives the timeline feature (v0.5) git history for free. A DB is only a cache later.

### D-07 — Art style & assets · Open

- **Options:** Low-poly CC0 kits (Kenney, Quaternius) · Custom Blender models · Pure procedural boxes/shapes
- **Recommendation:** **Low-poly CC0 kits** to start, isometric-ish camera, soft pastel palette. Boxes during early Phase 2. Custom art only when the idea is proven.

### D-08 — LLM key & cost model · Open

- **Options:** Bring-your-own Anthropic key · Hosted key paid by you · Both
- **Recommendation:** **BYO key** for the open-source tool (you pay nothing, users control cost). A hosted demo with a rate-limited shared key is optional later.

### D-09 — Hosting · Open

- **Options:** Static (GitHub Pages / Cloudflare Pages) + small server on Fly.io/Render/Cloudflare Workers · Vercel · Self-host only (Docker)
- **Recommendation:** decide in Phase 6. With D-02 = Vite and D-03 = (a), the viewer can go on **GitHub Pages for free** from day one as a live demo.

### D-10 — Product-first or research-first · Decided: research-first

The research questions (RQ1–RQ3) drive priorities. Consequences: an RQ2 eval set lands with the agent (Phase 5); a Kanban baseline view and a study mode with consented logging land in Phase 6; the viewer has an interaction-event hook from Phase 2; ethics approval and the target venue are worked on in parallel. Plan: [docs/research.md](docs/research.md).

### D-11 — The AI does not generate 3D meshes · Decided

The AI produces a **scene schema** (which modules, which metaphors, which parts, which flows). Themes render it from curated assets. "AI-generated 3D prototype" in the pitch means _AI-composed_, not AI-modelled. Reason: reliability, consistency, testability and speed.

### D-12 — Status is derived, never stored · Decided

Part/zone status is computed from issue + PR state at runtime. The scene file only stores _structure_ and _links_. Reason: one source of truth (the tracker), no drift.

### D-13 — Cross-theme common kit · Decided

Modules that appear in most products get reusable metaphors that work in any theme: **analytics → analyst's room** (person at a desk with documents and charts), **notifications → postal system** (mailbox → sorting station → recipient's letterbox), **translation/i18n → interpreter** (a person relaying speech between two others). The generic annex is the last resort. Reason: richer than a blank box, written once and reused by every theme, and the postal route doubles as a data-flow animation.
