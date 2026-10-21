# Decisions

A running log of choices. **Open** = needs your call (my recommendation is given). **Decided** = settled; change it by editing here with a reason.

| ID | Topic | Status | Needed by |
|---|---|---|---|
| D-01 | Monorepo tooling | Open | Phase 0.2 |
| D-02 | Web framework | Open | Phase 0.2 |
| D-03 | Backend shape | Open | Phase 4 |
| D-04 | License | Decided (MIT, changeable) | — |
| D-05 | GitHub auth | Open | Phase 4 / 6 |
| D-06 | Where the scene lives | Open | Phase 4 |
| D-07 | Art style & assets | Open | Phase 2 |
| D-08 | LLM key & cost model | Open | Phase 5 |
| D-09 | Hosting | Open | Phase 6 |
| D-10 | Product-first or research-first | Open | Before Phase 5 |
| D-11 | The AI does not generate 3D meshes | Decided | — |
| D-12 | Status is derived, never stored | Decided | — |

---

### D-01 — Monorepo tooling · Open
- **Options:** pnpm workspaces only · pnpm + Turborepo · Nx
- **Recommendation:** **pnpm workspaces only.** Add Turborepo later if builds get slow. Nx is overkill here.

### D-02 — Web framework · Open
- **Options:** Next.js (as in the original doc) · Vite + React SPA
- **Recommendation:** **Vite + React SPA** for the viewer. The 3D canvas is all client-side, so Next.js's SSR/RSC adds friction to R3F and gives us nothing until we need server routes. If we later want API routes in the same app, D-03 can still add a small server.
- **Trade-off:** Next.js would give us API routes + OAuth helpers (Auth.js) in one deploy. If you value "one deployable thing" over simplicity, choose Next.js.

### D-03 — Backend shape · Open
- **Options:**
  a) **No backend for MVP-dev:** browser talks to GitHub API with a token, scene lives in the repo (D-06), LLM called with a BYO key.
  b) Small Node server (Hono or Fastify) in `apps/server`: connectors, agent, webhooks, SSE.
  c) Next.js route handlers (only if D-02 = Next.js).
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

### D-10 — Product-first or research-first · Open
This is the biggest "who is this for?" question.
- **Product-first:** optimise for real users and contributors; research is a nice-to-have.
- **Research-first (e.g. thesis/paper):** we need from early on an eval dataset for RQ2, a "Kanban view" of the same data for RQ1 comparisons, interaction logging (with consent), and a study plan/ethics approval timeline.
- **Recommendation:** tell me which. If research matters even a bit, we add the RQ2 eval set in Phase 5 (cheap) and a Kanban view in Phase 6 (cheap), and keep the rest optional.

### D-11 — The AI does not generate 3D meshes · Decided
The AI produces a **scene schema** (which modules, which metaphors, which parts, which flows). Themes render it from curated assets. "AI-generated 3D prototype" in the pitch means *AI-composed*, not AI-modelled. Reason: reliability, consistency, testability and speed.

### D-12 — Status is derived, never stored · Decided
Part/zone status is computed from issue + PR state at runtime. The scene file only stores *structure* and *links*. Reason: one source of truth (the tracker), no drift.
