# Q1 Overview

> High-level Q1 checklist for client refactor baseline work.

## Goal

Finish discovery and agreement work needed before code migration. Q1 output must make runtime shape, risk, config, coupling, and seam boundaries explicit.

## Current status

### Done already
Q1 documentation baseline is drafted.

Done files:
- `architecture-map.md`
- `critical-flows-and-smoke-pack.md`
- `config-contract.md`
- `coupling-inventory.md`
- `seam-design.md`
- `gate-a-checklist.md`
- `overview.md`

What this means:
- Architecture baseline exists
- Critical flows and smoke pack exist
- Config contract exists
- Hidden-coupling inventory exists
- Seam proposal exists
- Gate A checklist exists

### Still to do in Q1
Q1 is **not** finished just because docs exist. Remaining Q1 work is review, agreement, and acceptance.

Remaining work:
1. Review docs with team/stakeholders
2. Agree top 5 hotspots
3. Agree top critical flows
4. Accept config contract as accurate
5. Accept seam boundaries for Q2
6. Decide Gate A: proceed to Q2 or do more discovery

### Not part of Q1
- No migration work
- No seam implementation
- No broad code refactor
- No config wrapper yet
- No provider/auth extraction yet

## Priority summary

| Priority | Work | Why |
|---|---|---|
| P0 | Architecture baseline | Need trusted map before extraction. |
| P0 | Critical flows + smoke pack | Protect auth, save, collab, prefs, paid/free behavior. |
| P0 | Config contract | Prevent config drift and hidden runtime breakage. |
| P0 | Gate A decision | No migration before agreement. |
| P1 | Hidden-coupling inventory | Needed to estimate blast radius and seam cost. |
| P1 | Seam design | Defines Q2 extraction targets. |

## Q1 deliverables

Each item below has 2 states:
- **Drafted now** = document exists
- **Done for Q1** = document is reviewed and accepted

### P0 — Architecture baseline
**Status:** Drafted now. Still needs review/acceptance.

Document startup path, render path, build path, hotspots, and globals.

Links:
- [Startup path](./architecture-map.md#1-startup-path)
- [Template / Render path](./architecture-map.md#2-template--render-path)
- [Build path](./architecture-map.md#3-build-path)
- [Controller / Model hotspots](./architecture-map.md#4-controller--model-hotspots)
- [Global state map](./architecture-map.md#5-global-state-map)

Done when:
- Team can explain boot sequence
- Team can name top hotspots
- Team understands build inputs and output risks

### P0 — Critical flows + smoke pack
**Status:** Drafted now. Still needs review/acceptance.

Map must-preserve flows and define manual validation.

Links:
- [Critical flows](./critical-flows-and-smoke-pack.md#1-critical-flows)
- [Smoke validation pack](./critical-flows-and-smoke-pack.md#2-smoke-validation-pack)
- [Flow-to-source mapping](./critical-flows-and-smoke-pack.md#3-flow-to-source-mapping)
- [Regression risk hotspots](./critical-flows-and-smoke-pack.md#4-regression-risk-hotspots)

Done when:
- Top critical flows agreed
- Each flow mapped to source files
- Pass/fail smoke checks ready for later phases

### P0 — Config contract
**Status:** Drafted now. Still needs review/acceptance.

Document real runtime keys, missing example keys, and ownership.

Links:
- [Actual keys used at runtime](./config-contract.md#2-actual-keys-used-at-runtime)
- [Example file vs. runtime mismatch](./config-contract.md#3-example-file-vs-runtime-mismatch)
- [Where keys enter app](./config-contract.md#4-where-keys-enter-the-app)
- [Ownership map](./config-contract.md#5-ownership-map)
- [Recommendations](./config-contract.md#6-recommendations)

Done when:
- Runtime key set trusted
- Example mismatch documented
- Ownership/change risk known

### P1 — Hidden-coupling inventory
**Status:** Drafted now. Still needs review/acceptance.

Catalog globals, storage, inline actions, and eval paths.

Links:
- [AFN_VARS reads](./coupling-inventory.md#1-afn_vars-reads-config-coupling)
- [window usage](./coupling-inventory.md#2-window-usage-global-namespace-coupling)
- [Cookies](./coupling-inventory.md#3-cookies)
- [sessionStorage](./coupling-inventory.md#4-sessionstorage)
- [localStorage](./coupling-inventory.md#5-localstorage)
- [Inline onclick](./coupling-inventory.md#6-inline-onclick)
- [data-eb-click](./coupling-inventory.md#7-data-eb-click)
- [eval](./coupling-inventory.md#8-eval)
- [Areas of highest coupling density](./coupling-inventory.md#10-areas-of-highest-coupling-density)

Done when:
- Hidden dependencies visible
- Highest-risk dynamic behavior cataloged
- New seam work has blast-radius map

### P1 — Seam design
**Status:** Drafted now. Still needs review/acceptance.

Define boundaries only. No migration yet.

Links:
- [Seam boundaries](./seam-design.md#1-seam-boundaries-conceptual)
- [Config access seam](./seam-design.md#2-seam-1-config-access)
- [Auth / Session seam](./seam-design.md#3-seam-2-auth--session)
- [Provider ops seam](./seam-design.md#4-seam-3-provider-ops)
- [Domain adapters](./seam-design.md#5-seam-4-domain-adapters)
- [Hard coupling problems](./seam-design.md#6-key-hard-coupling-problems-why-extraction-is-risky)
- [Priorities for extraction](./seam-design.md#7-priorities-for-extraction)
- [Migration rules](./seam-design.md#8-migration-rules)

Done when:
- Q2 seam targets agreed
- Hard blockers called out
- Team agrees no new code bypasses seams

### P0 — Gate A
**Status:** Checklist drafted. Decision still pending.

Use Gate A to decide if Q2 can start.

Links:
- [Gate A checklist](./gate-a-checklist.md#gate-a-proceed-to-q2)
- [Decision](./gate-a-checklist.md#decision)
- [If more discovery needed](./gate-a-checklist.md#if-do-more-discovery--suggested-next-steps)

Done when:
- Top 5 hotspots agreed
- Top 5 critical flows agreed
- Config contract accepted
- Seam boundaries accepted

## Must-call-out risks

These must stay visible through Q1:
- Google auth blocks boot path
- Preferences tied to Google Drive appfolder
- `eval`, inline `onclick`, and `data-eb-click` spread across UI/event system
- Build depends on `node-sass`, live JSON fetches, and implicit `find` ordering

See:
- [Architecture build path](./architecture-map.md#3-build-path)
- [Critical flows](./critical-flows-and-smoke-pack.md#1-critical-flows)
- [Coupling inventory](./coupling-inventory.md)
- [Hard coupling problems](./seam-design.md#6-key-hard-coupling-problems-why-extraction-is-risky)

## Q1 exit criteria

Q1 complete only if:
1. Discovery docs exist
2. Discovery docs are reviewed and trusted
3. Smoke pack exists for protected flows
4. Top hotspots are agreed
5. Top critical flows are agreed
6. Config contract is accepted
7. Seam plan is accepted
8. Gate A decision is made

If any fail: more discovery. No migration.

## Simple done vs to-do summary

### Done now
- Q1 docs drafted
- Evidence gathered from source files
- Risks documented
- Gate A checklist created

### To do before Q1 is complete
- Review docs
- Resolve disagreements/corrections
- Confirm priorities
- Accept seam boundaries
- Make Gate A decision

### To do after Q1, not in Q1
- Implement config wrapper
- Extract auth/session seam
- Extract provider adapters
- Start migration work
