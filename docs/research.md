# Research plan

Diorama is research-first (DECISIONS.md D-10). This file tracks the research side alongside the build in [PHASES.md](../PHASES.md).

## Research questions

| RQ | Question | What we need to build | Measure (draft) |
|---|---|---|---|
| RQ1 | Do domain metaphors help stakeholders understand project status better than Kanban boards? | Diorama view + **Kanban view of the same scene data** | Accuracy and time on comprehension tasks ("what % of checkout is done?", "what's blocked?"), NASA-TLX workload, SUS usability |
| RQ2 | Can an LLM reliably turn a backlog into a coherent spatial metaphor? | Agent + **eval set** + scoring script | Module recall/precision vs expert mapping, metaphor-fit ratings by humans, consistency across repeated runs |
| RQ3 | Does seeing data flow help teams find integration problems earlier? | Flow visualisation + **injected-fault scenarios** | Detection rate and time-to-detect, with vs without flows |

## Workstreams

- [ ] **Related work**: CodeCity, Gource, software cities, code maps, VR software visualisation, metaphor theory in HCI, LLM-for-architecture. → `docs/related-work.md`
- [ ] **Target venue and deadline**: *not decided yet (2026-10-21)*. Pick once a working prototype exists, roughly after Phase 2. Candidates: VISSOFT, ICSE/FSE new-ideas tracks, CHI late-breaking work, a thesis
- [ ] **Ethics / IRB**: find out what your institution requires and how long approval takes
- [ ] **RQ2 eval set**: ~10–20 project descriptions/backlogs (open-source repos are a good source) with hand-made expected mappings
- [ ] **Study design for RQ1/RQ3**: participants (who, how many), tasks, within/between subjects, pilot run
- [ ] **Logging**: opt-in, anonymised interaction events from the viewer (camera moves, zone clicks, time on task)

## How this maps onto the phases

| Phase | Research addition |
|---|---|
| 1 | Schema includes everything the Kanban baseline needs, so both views read one scene |
| 2 | Viewer emits interaction events through one logging hook (off by default) |
| 5 | RQ2 eval set + scoring script land with the agent |
| 6 | Kanban baseline view; study mode (fixed scene, task prompts, timer, consent screen) |
| 7+ | Flow animation + fault-injection scenarios for RQ3; run studies |
