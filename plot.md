# Diorama — The Plot

> The single source of truth for *what* Diorama is and *why*.
> For *when* and *in what order*, see [PHASES.md](PHASES.md).
> For *choices we made or still need to make*, see [DECISIONS.md](DECISIONS.md).
> The original brainstorm this came from is kept in [docs/origin.md](docs/origin.md).

---

## 1. One-sentence pitch

**Diorama turns a software project into a living 3D miniature world: you see the whole finished product as a ghost model on day one, and each piece turns solid as the team ships it.**

## 2. The problem

| Tool people use today | What it shows | What it misses |
|---|---|---|
| Kanban / Jira / Gantt | Tasks and dates | The *shape* of the product. You see tickets, not the thing |
| C4 / UML / Structurizr | Architecture | Too technical for clients, static, and drifts away from sprint reality |
| CodeCity, Gource | Code that *already exists* | Nothing about what is *planned*; generic shapes with no domain meaning |

A manager, client or new developer cannot glance at any of these and answer:
*"What are we building, how far along is it, and how do the parts connect?"*

## 3. The idea in one picture

```
  "I'm building an online shop"            GitHub issues & milestones
              │                                        │
              ▼                                        ▼
     ┌─────────────────┐   module→zone map    ┌─────────────────┐
     │  Agent interview │ ───────────────────▶ │  Scene schema   │ ◀── status sync
     │  (Claude API)    │                      │  (JSON, typed)  │
     └─────────────────┘                      └────────┬────────┘
                                                       │ rendered with a theme
                                                       ▼
                                   ┌──────────────────────────────────────┐
                                   │  3D shop diorama in the browser      │
                                   │  🚪 entrance   ▓ solid  (done)        │
                                   │  🗄 shelves    ▒ half   (in progress) │
                                   │  🛒 trolley    ░ ghost  (planned)     │
                                   │  💳 counter → 📦 warehouse → 🚚 van    │
                                   └──────────────────────────────────────┘
```

1. **Describe** — the user says what they're building.
2. **Interview** — an AI agent asks follow-up questions and breaks the product into modules (auth, catalogue, cart, payments, …).
3. **Map** — each module becomes a piece of a **domain metaphor** from the business's own world (an e-commerce app becomes a shop; auth is the entrance door, cart is the trolley).
4. **Ghost** — the whole finished product is shown first as a translucent ghost prototype.
5. **Build up** — as issues close, their pieces become solid and slot into place.
6. **Flow** — data moving between modules is animated (a parcel goes shelf → trolley → counter → warehouse → van).

## 4. Who it's for

| Persona | What they want from Diorama |
|---|---|
| **Client / non-technical stakeholder** | "How far along is my shop?" without reading Jira |
| **Project manager** | One shareable view of scope + progress, sprint by sprint |
| **Developer (esp. new joiner)** | How modules fit together and where data goes |
| **Researcher (you, maybe)** | A testbed for "do domain metaphors beat Kanban for understanding?" |

## 5. What "AI-generated 3D" actually means here (important)

The AI does **not** generate 3D meshes. Generating geometry with an LLM is slow, unreliable and ugly.
Instead:

- A **theme** (e.g. `ecommerce-shop`) ships a curated kit of low-poly 3D assets and a set of **slots** (entrance, shelves, counter, …) with fixed positions.
- The **AI composes**: it decides which modules exist, which slot/metaphor each one gets, how many parts each zone has, and which data flows connect them. Its output is just a **scene schema** (JSON).
- The **viewer renders** that JSON deterministically using the theme's assets.

This keeps the AI part testable (it's "text in → validated JSON out") and the visuals consistent.

## 6. Core concepts (glossary)

| Term | Meaning |
|---|---|
| **Project** | One product being built; linked to one repo (GitHub first) |
| **Module** | A functional area of the software: auth, cart, payments |
| **Theme** | A domain world (shop, hospital, bank) — asset kit + slots + metaphor vocabulary |
| **Zone** | A module placed in the theme, e.g. `cart` → trolley area |
| **Part** | A buildable sub-piece of a zone (a single shelf, the door handle). Usually linked to one or more issues |
| **Status** | `planned` (ghost) → `in_progress` (partly solid) → `done` (solid). **Derived from issues**, never typed by hand |
| **Flow** | A directed data edge between zones ("add item": catalogue → cart) |
| **Scene schema** | The JSON document describing zones, parts, flows, and links to issues. The heart of the system |
| **Connector** | Adapter to a tracker (GitHub, later Jira) that reports issue/milestone state |
| **Sprint** | A GitHub Milestone (in v0.1) |

## 7. Architecture

```
diorama/
├── apps/
│   ├── web/          3D viewer + UI (React, React Three Fiber)
│   └── server/       API, connectors, agent, sync (Node) — may start inside web, see DECISIONS.md
└── packages/
    ├── schema/       Scene schema types + validation (Zod) + status derivation. Zero UI deps.
    ├── themes/       Theme definitions + assets (shop first)
    ├── connectors/   GitHub (then Jira) → normalized issue model
    └── agent/        Interview + mapping prompts, Claude API calls, output → schema
```

Layers and responsibilities:

1. **Schema** (`packages/schema`) — the contract every other part speaks. Built first.
2. **Themes** (`packages/themes`) — what a shop/hospital/bank looks like; pluggable so the community can add more.
3. **Viewer** (`apps/web`) — renders a scene + theme. Ghost → solid materials, click a zone to inspect.
4. **Connectors** (`packages/connectors`) — turn GitHub issues/milestones into a normalized model.
5. **Sync** — keeps the scene's derived status fresh (polling first, webhooks later) and pushes updates to viewers.
6. **Agent** (`packages/agent`) — the interview and module→zone mapping using the Claude API with structured output.

**Stack:** TypeScript everywhere, pnpm workspaces, Vite + React + React Three Fiber + drei on three.js, Zod for schema, Claude API for the agent, SQLite (via a light ORM) only once we need server state. See [DECISIONS.md](DECISIONS.md) for what's settled vs open.

## 8. Scene schema — first draft

Improved from the original sketch: parts inside zones, tracker-agnostic issue refs, status *derived* rather than stored, layout separated from meaning, and a schema version.

```jsonc
{
  "schemaVersion": 1,
  "project": { "name": "Corner Shop", "repo": "github:acme/corner-shop" },
  "theme": "ecommerce-shop",
  "zones": [
    {
      "id": "auth",
      "label": "Authentication",
      "metaphor": "entrance",          // a slot the theme knows how to draw
      "sprint": "milestone:1",
      "parts": [
        { "id": "login",  "label": "Login form",   "asset": "door",          "issues": ["github:12"] },
        { "id": "signup", "label": "Sign-up flow", "asset": "security-desk", "issues": ["github:14"] }
      ]
    },
    {
      "id": "catalogue",
      "label": "Product catalogue",
      "metaphor": "shelves",
      "sprint": "milestone:2",
      "parts": [
        { "id": "listing", "label": "Product listing", "asset": "shelf", "issues": ["github:20"] }
      ]
    }
  ],
  "flows": [
    { "from": "catalogue", "to": "cart", "label": "add item" }
  ]
}
```

Status is computed at runtime: a part is `done` when all its issues are closed, `in_progress` when some are closed or one has an open PR, else `planned`. A zone's status rolls up from its parts.

The scene file can live **in the target repo itself** as `.diorama/scene.json` — versioned, reviewable in PRs, no database needed for v0.1 (see DECISIONS.md D-06).

## 9. Pilot theme: e-commerce shop

| Software module | Shop metaphor | MVP? |
|---|---|---|
| Authentication | Entrance door / security desk | ✅ |
| Product catalogue | Shelves | ✅ |
| Cart | Shopping trolley | ✅ |
| Checkout & payments | Checkout counter | ✅ |
| Inventory | Back warehouse | ✅ |
| Search | Store directory / signage | later |
| Orders & shipping | Loading dock + delivery van | later |
| Admin dashboard | Manager's office | later |
| *Anything that doesn't fit* | Generic "annex" building with a sign | needed early |

**Data-flow example:** a parcel moves shelf → trolley → counter → warehouse → van.

### Common kit: metaphors that work in every theme

Some modules show up in almost every product, whatever the business. They get their own **common kit**: small scenes any theme can place next to its domain zones. They're more meaningful than a blank annex and more reusable than shop-only props.

| Software module | Common-kit metaphor | Natural data flow |
|---|---|---|
| Analytics / reporting | **Analyst's room**: a person at a desk covered in documents, charts on the wall | Data from other zones arrives as paper stacks on the desk |
| Notifications (email, push, SMS) | **Postal system**: sender drops a letter in a mailbox → sorting station → letter reaches the recipient's letterbox | A letter travelling the route (a natural fit for v0.2 flow animation) |
| Translation / i18n | **Interpreter**: one person listens to a speaker and talks to a third person | Speech bubbles changing language as they pass through |

The **annex** stays as the last resort for modules that fit neither the theme nor the common kit. Good candidates to add to the kit later: logging/audit (security camera room or archive), file storage (storage lockers), scheduling/cron (clock tower), search (library card catalogue).

## 10. Scope

**v0.1 (MVP) must do:**
1. Connect a GitHub repo and import issues + milestones.
2. Agent interview → proposed module→zone mapping the user can edit.
3. Shop scene with five zones: entrance, shelves, cart, checkout, warehouse.
4. Live progress: closing an issue makes its part solid.
5. Click a zone → its issues, assignees and progress.

**Explicitly NOT in v0.1:** animated data flow, Jira, Theme SDK, timeline replay, multi-user accounts, mobile, real-time collaboration, generating 3D meshes.

**Later (roadmap):** v0.2 animated data flow · v0.3 Jira · v0.4 Theme SDK + community themes · v0.5 timeline scrubber · research track (user study vs Kanban).

## 11. Research angle

**Gap:** no known tool combines (a) a view of the *planned* product before it's built, (b) an AI-generated *domain-specific* metaphor, and (c) *live* links to sprint progress and data flow.

- **RQ1:** Do domain metaphors help stakeholders understand project status better than Kanban boards?
- **RQ2:** Can an LLM reliably turn a backlog into a coherent spatial metaphor?
- **RQ3:** Does seeing data flow help teams find integration problems earlier?

**Diorama is research-first (DECISIONS.md D-10).** That shapes engineering from the start:
- **RQ1** needs a **Kanban view of the same data**, so participants compare like with like.
- **RQ2** needs an **eval set** of project descriptions/backlogs with expected mappings, plus a scoring method.
- **RQ3** needs a way to **inject integration problems** into a scene and measure who spots them and how fast.
- Studies need **consented interaction logging** and a study protocol. Ethics approval can take weeks, so start it early.

The research plan lives in [docs/research.md](docs/research.md).

## 12. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Real projects have modules that don't fit the metaphor (analytics, notifications, i18n) | Cross-theme **common kit** (analyst's room, postal system, interpreter) and then a generic "annex" slot; never force a bad metaphor |
| Issues don't map cleanly to parts | Deterministic first: GitHub labels like `zone:cart`. Agent only *suggests*; user confirms |
| The 3D looks cheap / art is a bottleneck | Low-poly style, CC0 kits (Kenney, Quaternius) in glTF, ghost effect via material not new models |
| Scope creep for a solo project | Strict phases; each phase ends with something runnable; MVP list above is the contract |
| Webhooks need a public server | Polling / manual "sync" button first; webhooks in a later phase |
| LLM output is invalid or inconsistent | Structured output validated by the Zod schema; retry on failure; user always edits before saving |
| 3D isn't accessible / doesn't work on weak devices | A plain 2D list view of the same scene is always available |
