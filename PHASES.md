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

**Research-first:** a research track runs alongside every phase (related work, ethics, eval set, Kanban baseline, study mode). Details in [docs/research.md](docs/research.md).

**Why this order?** The schema is the contract everything else talks through, so it comes first. The viewer comes before GitHub and AI because it's the part that proves the idea is _worth_ building. If the shop doesn't look good with hand-written JSON, connectors and agents won't save it. GitHub before AI because real data shows what the agent needs to handle.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

---

## ✅ Phase 0 — Foundation (part 1: done)

**Goal:** A clean public repo with the plan written down.

- [x] Planning docs: `plot.md`, `PHASES.md`, `DECISIONS.md`, `README.md`, `CLAUDE.md`
- [x] Git repo + public GitHub repo
- [x] License (MIT), `.gitignore`

## ✅ Phase 0 — Foundation (part 2: monorepo)

**Goal:** `pnpm install && pnpm build && pnpm test` works on an empty monorepo.

- [x] pnpm workspaces: `apps/web`, `packages/schema` (others added when their phase starts)
- [x] Shared `tsconfig`, ESLint + Prettier, Vitest
- [x] GitHub Actions CI: install, typecheck, lint, test
- [x] `CONTRIBUTING.md` (short)

**Exit check:** CI is green on a PR.
**Stack:** pnpm 9 workspaces, TypeScript 6.0 (typescript-eslint doesn't support TS 7 yet), Vite 8, React 19, ESLint 10, Prettier, Vitest 5, Node 24.

---

## ✅ Phase 1 — Scene schema (`packages/schema`)

**Goal:** A typed, validated, versioned definition of a scene, plus the status logic.

- [x] Zod schemas: `Scene`, `Zone`, `Part`, `Flow`, `IssueRef` (`"github:12"` style), `schemaVersion`
- [x] Inferred TS types + exported JSON Schema (for editors and for the LLM's structured output later)
- [x] `deriveStatus(scene, issueStates)` → per-part and per-zone `planned | in_progress | done` + % complete
- [x] Validation rules beyond shape: unique ids, flows point at real zones, metaphor exists in theme (theme check can be a hook)
- [x] Example scenes: `examples/corner-shop.scene.json` (6 zones incl. a common-kit postal route, 15 parts, 5 flows) + `corner-shop.issues.json` with fake tracker state
- [x] Unit tests for validation + status derivation

**Exit check:** `pnpm test` covers good + broken example scenes; status rollup is tested.

---

## 🟨 Phase 2 — Static 3D viewer (`apps/web`)

**Goal:** Load a hand-written `scene.json` and see a shop diorama in the browser.

- [x] React Three Fiber canvas, orbit camera with sensible limits, soft lighting, ground plane
- [x] Place the 5 shop zones at fixed slot positions (+ the postal-route common-kit slot and annex slots; low-poly props built from primitives)
- [x] **Ghost / in-progress / solid materials** (translucent + outline → partial → full colour)
- [x] Zone labels; hover highlight; click → side panel with parts and their (fake) issues
- [x] Static flow lines between zones (no animation yet)
- [x] A "status override" dev panel to flip parts between states and watch the scene change
- [x] Load scene from file / URL param (`?scene=…&issues=…`, an "Open files…" button, or drag and drop)
- [x] One interaction-event hook (scene load, zone hover/select, camera move), off by default; `?log=console` prints events

**Exit check:** You can show the screen to a non-developer and they can tell what's done and what isn't. ← **waiting on you**: show it to someone and note what confused them.
**D-07:** primitive-built props are enough for now; the asset decision moves to Phase 3.

**Follow-ups noticed:** JS bundle is ~357 KB gzipped (three.js + drei), worth trimming before release; on phones, the 2D list view (Phase 6) is the real answer.

---

## 🟨 Phase 3 — Theme system (`packages/themes`)

**Goal:** The shop is data, not hard-coded React. Adding a theme doesn't touch viewer code.

- [x] Theme manifest: id, name, slots (id, position, footprint), metaphor vocabulary, assets per part type
- [ ] **Deferred:** real low-poly glTF assets (CC0 kit + Draco/meshopt compression). Waiting on D-07; props are still primitives, behind a theme `assets` list so swapping them later touches only `viewer/props.tsx`
- [x] **Common kit** usable by every theme: analyst's room (analytics), postal system (notifications), interpreter (translation/i18n)
- [x] Generic **annex** slot as the last resort for modules that fit neither
- [x] Layout rule for N parts inside a zone (grid/row inside the slot footprint)
- [x] Schema ↔ theme validation (metaphor/asset must exist in theme)

**Done:** `packages/themes` (manifest, layout, common kit, `ecommerce-shop`, `test-boxes`); the viewer reads the theme named in the scene and rejects unknown themes, metaphors and assets with readable errors. `examples/corner-shop.test-boxes.scene.json` is the shop re-themed by editing only JSON.

**Exit check (met):** Swapping `theme` in the JSON to a second tiny test theme (even just coloured boxes) renders without code changes.

---

## ✅ Phase 4 — GitHub connector (`packages/connectors`)

**Goal:** Real issues drive the scene.

- [x] Auth for development: a fine-grained personal access token (OAuth comes in Phase 6)
- [x] Fetch issues, milestones, linked PRs for a repo (GraphQL, paginated up to 5,000 issues, typed errors incl. rate limits)
- [x] Normalized model: `{ ref, title, state, assignees, milestone, labels, url, linkedPRs }`
- [x] Mapping without AI: labels like `zone:cart` / `part:cart/trolley` → parts
- [x] Read `.diorama/scene.json` from the repo (D-06). `writeRepoFile` exists and is tested, but nothing in the UI saves yet; the agent in Phase 5 is what will write scenes
- [x] Polling sync + a "Sync now" button; viewer updates live
- [x] Unmapped issues tray ("these issues aren't placed anywhere yet")

**Also done:** the `dropped` status for issues closed as "not planned" (D-15), issue titles/assignees/sprints in the zone panel, a GitHub dialog with sync state and the unplaced-issues tray.
**Exit check (met in a simulated GitHub):** in headless Chrome, closing issues in the fake GitHub and pressing _Sync now_ moved Cart 0% → 75% and the overall build 40% → 50%; closing an issue as "not planned" turned its part into a grey ghost. The query and error handling were also run against the real API (read-only). ← **waiting on you**: try it on a real repo with a throwaway token.

---

## ⬜ Phase 5 — Agent (`packages/agent`)

**Goal:** From a plain-English description (+ optional existing backlog) to a proposed scene.

- [ ] Interview flow: 3–6 follow-up questions max, then a module list
- [ ] Mapping: modules → theme slots/metaphors, parts per zone, flows; issues → parts
- [ ] Claude API with structured output validated against the Phase 1 JSON Schema; retry on invalid
- [ ] Review screen: user edits/accepts the mapping before it's saved (agent never writes silently)
- [ ] RQ2 eval set (~10–20 project descriptions/backlogs + expected mappings) and a scoring script, run in CI or on demand
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
- [ ] Kanban baseline view of the same scene (RQ1)
- [ ] Study mode: consent screen, fixed scene, task prompts, timer, opt-in interaction logging
- [ ] Deploy (D-09), demo project, screenshots/GIF in README
- [ ] Tag `v0.1.0`

**Exit check:** A friend connects their own repo and understands the result without your help.

---

## Phase 7+ — Roadmap after v0.1

| Version  | Feature                                                             |
| -------- | ------------------------------------------------------------------- |
| v0.2     | Animated data flow between zones (parcels moving along flows)       |
| v0.3     | Jira connector (connector interface proves itself)                  |
| v0.4     | Theme SDK + community theme library (hospital, bank, food delivery) |
| v0.5     | Timeline scrubber: replay the build sprint by sprint                |
| Research | User study: Diorama vs Kanban (RQ1–RQ3)                             |
