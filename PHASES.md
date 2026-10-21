# Diorama — Development Phases

We build Diorama one phase at a time. Every phase ends with **something you can run or see**, and has an exit check we agree on before moving on.
Big picture: [plot.md](plot.md) · Choices: [DECISIONS.md](DECISIONS.md)

```
Phase 0  Foundation            repo, monorepo, tooling, CI
Phase 1  Scene schema          the JSON contract + validation + status logic
Phase 2  Static viewer         hand-written scene.json → 3D shop with ghost/solid
Phase 3  Theme system          shop theme as a real package; slots, assets, annex
Phase 4  GitHub connector      real issues/milestones → live status (polling)
Phase 5  Agent                 interview + module→zone mapping via Claude API
Phase 6  MVP polish & release  inspect panel, 2D view, deploy, webhooks, v0.1.0
──────── v0.1 shipped ────────
Phase 7+ Roadmap               data flow animation, Jira, Theme SDK, timeline, research
```

**Why this order?** The schema is the contract everything else talks through, so it comes first. The viewer comes before GitHub and AI because it's the part that proves the idea is *worth* building. If the shop doesn't look good with hand-written JSON, connectors and agents won't save it. GitHub before AI because real data shows what the agent needs to handle.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

---

## ✅ Phase 0 — Foundation (part 1: done)
**Goal:** A clean public repo with the plan written down.

- [x] Planning docs: `plot.md`, `PHASES.md`, `DECISIONS.md`, `README.md`, `CLAUDE.md`
- [x] Git repo + public GitHub repo
- [x] License (MIT), `.gitignore`

## ⬜ Phase 0 — Foundation (part 2: monorepo)
**Goal:** `pnpm install && pnpm build && pnpm test` works on an empty monorepo.

- [ ] pnpm workspaces: `apps/web`, `packages/schema` (others added when their phase starts)
- [ ] Shared `tsconfig`, ESLint + Prettier, Vitest
- [ ] GitHub Actions CI: install, typecheck, lint, test
- [ ] `CONTRIBUTING.md` (short)

**Exit check:** CI is green on a PR.
**Blocked by:** D-01 (monorepo tooling), D-02 (web framework).

---

## ⬜ Phase 1 — Scene schema (`packages/schema`)
**Goal:** A typed, validated, versioned definition of a scene, plus the status logic.

- [ ] Zod schemas: `Scene`, `Zone`, `Part`, `Flow`, `IssueRef` (`"github:12"` style), `schemaVersion`
- [ ] Inferred TS types + exported JSON Schema (for editors and for the LLM's structured output later)
- [ ] `deriveStatus(scene, issueStates)` → per-part and per-zone `planned | in_progress | done` + % complete
- [ ] Validation rules beyond shape: unique ids, flows point at real zones, metaphor exists in theme (theme check can be a hook)
- [ ] Example scenes: `examples/corner-shop.scene.json` (5 zones, ~15 parts, a few flows)
- [ ] Unit tests for validation + status derivation

**Exit check:** `pnpm test` covers good + broken example scenes; status rollup is tested.

---

## ⬜ Phase 2 — Static 3D viewer (`apps/web`)
**Goal:** Load a hand-written `scene.json` and see a shop diorama in the browser.

- [ ] React Three Fiber canvas, orbit camera with sensible limits, soft lighting, ground plane
- [ ] Place the 5 shop zones at fixed slot positions (placeholder boxes are fine at first)
- [ ] **Ghost / in-progress / solid materials** (translucent + outline → partial → full colour)
- [ ] Zone labels; hover highlight; click → side panel with parts and their (fake) issues
- [ ] Static flow lines between zones (no animation yet)
- [ ] A "status override" dev panel to flip parts between states and watch the scene change
- [ ] Load scene from file / URL param

**Exit check:** You can show the screen to a non-developer and they can tell what's done and what isn't.
**Decision needed during phase:** D-07 (art style / asset source).

---

## ⬜ Phase 3 — Theme system (`packages/themes`)
**Goal:** The shop is data, not hard-coded React. Adding a theme doesn't touch viewer code.

- [ ] Theme manifest: id, name, slots (id, position, footprint), metaphor vocabulary, assets per part type
- [ ] Real low-poly glTF assets for the 5 MVP zones (CC0 kit + Draco/meshopt compression)
- [ ] Generic **annex** slot for modules that don't fit the metaphor
- [ ] Layout rule for N parts inside a zone (grid/row inside the slot footprint)
- [ ] Schema ↔ theme validation (metaphor/asset must exist in theme)

**Exit check:** Swapping `theme` in the JSON to a second tiny test theme (even just coloured boxes) renders without code changes.

---

## ⬜ Phase 4 — GitHub connector (`packages/connectors`)
**Goal:** Real issues drive the scene.

- [ ] Auth for development: a fine-grained personal access token (OAuth comes in Phase 6)
- [ ] Fetch issues, milestones, linked PRs for a repo (GraphQL, paginated, rate-limit aware)
- [ ] Normalized model: `{ ref, title, state, assignees, milestone, labels, url, linkedPRs }`
- [ ] Mapping without AI: labels like `zone:cart` / `part:cart/trolley` → parts
- [ ] Read/write `.diorama/scene.json` from the repo (D-06)
- [ ] Polling sync + a "Sync now" button; viewer updates live
- [ ] Unmapped issues tray ("these issues aren't placed anywhere yet")

**Exit check:** Close an issue on GitHub → after sync, its part turns solid.
**Decision needed:** D-03 (backend shape), D-05 (auth) before this phase starts.

---

## ⬜ Phase 5 — Agent (`packages/agent`)
**Goal:** From a plain-English description (+ optional existing backlog) to a proposed scene.

- [ ] Interview flow: 3–6 follow-up questions max, then a module list
- [ ] Mapping: modules → theme slots/metaphors, parts per zone, flows; issues → parts
- [ ] Claude API with structured output validated against the Phase 1 JSON Schema; retry on invalid
- [ ] Review screen: user edits/accepts the mapping before it's saved (agent never writes silently)
- [ ] Small eval set: ~10 project descriptions + expected module lists → measure mapping quality (feeds RQ2)
- [ ] Bring-your-own API key handling (D-08)

**Exit check:** Describe a shop in a few sentences → get a valid, sensible scene you'd accept with ≤ 3 edits.

---

## ⬜ Phase 6 — MVP polish & release (v0.1.0)
**Goal:** Someone else can use it on their repo.

- [ ] GitHub OAuth (or GitHub App) instead of PAT
- [ ] Webhooks → server → push to viewer (SSE), polling kept as fallback
- [ ] Zone inspect panel: issues, assignees, progress, links
- [ ] 2D list/table view of the same scene (accessibility + weak devices)
- [ ] Sprint filter (show the world as of milestone N)
- [ ] Deploy (D-09), demo project, screenshots/GIF in README
- [ ] Tag `v0.1.0`

**Exit check:** A friend connects their own repo and understands the result without your help.

---

## Phase 7+ — Roadmap after v0.1
| Version | Feature |
|---|---|
| v0.2 | Animated data flow between zones (parcels moving along flows) |
| v0.3 | Jira connector (connector interface proves itself) |
| v0.4 | Theme SDK + community theme library (hospital, bank, food delivery) |
| v0.5 | Timeline scrubber: replay the build sprint by sprint |
| Research | User study: Diorama vs Kanban (RQ1–RQ3) |
