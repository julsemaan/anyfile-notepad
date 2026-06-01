# `client/` modernization — detailed refactor plan

> **Status:** Adopted  
> **Horizon:** 3–12 months  
> **Team constraint:** small bandwidth  
> **Key constraint:** behavior parity, internals flexible  

---

## Executive summary

Best path:

1. **Stabilize change surface** — make risk visible, reduce hidden coupling
2. **Carve runtime seams** — around auth, providers, config, domain models
3. **Modernize tooling** — remove dead build stack, improve reproducibility
4. **Migrate first UI slice** — preferences/options as proving ground
5. **Expand slice-by-slice** toward eventual replatform

---

## 1) Goals

### Primary goals
- Reduce regression risk
- Make client easier to change
- Lower hidden coupling
- Improve build reliability
- Prepare for future replatform
- Preserve business-critical flows

### Must-preserve flows
- Google Drive auth + file open / save
- Dropbox auth + file open / save
- Realtime collaboration
- Preferences behavior
- Monetization / ads / paid variant behavior
- Core editor behavior for modern evergreen browsers

---

## 2) Target end-state

### Near-term target (end of Q4)
Legacy app still runs, but behind cleaner boundaries:

- Config boundary — one access path for runtime config
- Provider/auth boundary — adapters for Google Drive, Dropbox
- Domain model boundary — local models instead of raw API responses
- UI slice boundaries — first slice migrated
- Reduced direct global usage
- Build reproducible, dependency risks mitigated

### Long-term target
New frontend architecture replaces legacy shell gradually:

- Modular features with explicit contracts
- Isolated UI slices
- Smaller controllers
- Testable services
- Minimal dynamic / eval behavior
- Full replatform feasible

---

## 3) Workstreams

### WS1 — Safety net
Stop blind breakage.

- Critical flow checklist
- Smoke validation pack
- Config key inventory
- Template/partial inventory
- Dependency/hotspot map

### WS2 — Runtime seams
Reduce unsafe coupling.

- Config access wrapper
- Provider adapters (Google Drive, Dropbox)
- Auth/session boundary
- Domain model mapping (file, syntax, preferences, user)
- Extracted editor subdomains

### WS3 — Tooling stabilization
Remove obsolete build risk.

- Sass modernization path
- Dependency inventory + ownership
- Reproducible build contract
- Asset manifest / source-of-truth
- Live JSON input strategy

### WS4 — UI modernization
Prove migration path safely.

- First UI slice: preferences/options
- Interop pattern for legacy + new slice
- Visual parity checks
- Rollback switch

### WS5 — Strategic replatform prep
Make later replacement cheaper.

- Framework decision criteria
- Slice migration playbook
- Deprecation list
- Retirement of globals / eval / inline actions

---

## 4) Quarterly phased plan

---

### Quarter 1 — Baseline + seam foundation

#### Objectives
- Make risk visible
- Make coupling visible
- Start reducing blast radius around auth / provider / config

#### Deliverables

1. **Client architecture map**
   - Startup path
   - Template/render path
   - Asset/build path
   - Controller/model hotspots
   - Global state map

2. **Critical flow map**
   - Google auth
   - Dropbox auth
   - New / open / save
   - Autosave
   - Collaboration
   - Preferences
   - Monetization touchpoints

3. **Config contract**
   - Actual runtime keys used
   - Stale/missing example keys
   - Single ownership map

4. **Seam design**
   - Config service boundary
   - Auth/provider service boundary
   - File/domain adapter boundary

5. **Smoke validation pack**
   - Manual or lightweight scripted checklist
   - Executed per phase

#### Work items
- Catalog all `AFN_VARS` usage
- Catalog all `window`, cookie, `sessionStorage`, `localStorage` usage
- Inventory inline `onclick`, `data-eb-click`, `eval` use
- Inventory controller responsibilities
- Define "new code goes through seam" rule

#### Decision gate
Proceed only if:
- Top 5 hotspots agreed
- Top 5 critical flows agreed
- Config contract documented
- Seam boundaries accepted

#### Improvement yield
- **Risk reduction:** hidden dependencies become visible
- **Maintainability:** new work has map, not guesswork
- **Onboarding:** faster context loading
- **Planning quality:** better estimation for later phases

#### KPI effect
- Regression triage time: down 10–15%
- New dev discovery time: down 20–30%
- Unknown config breakage risk: sharply reduced

---

### Quarter 2 — Runtime seams around auth / provider / config

#### Objectives
- Attack unsafe change surface first
- Protect strategic flows
- Create future migration anchor points

#### Deliverables

1. **Config boundary**
   - Client code stops reading config ad hoc
   - One access path for runtime config

2. **Provider adapters**
   - Google Drive adapter boundary
   - Dropbox adapter boundary
   - Normalized file/provider operations model

3. **Auth/session boundary**
   - Isolate cookie / session storage behavior
   - Centralize token / session handling rules

4. **EditorController decomposition plan + first extractions**
   - Save/autosave logic
   - Collaboration logic
   - File lifecycle logic
   - Preference interaction logic

5. **Anti-corruption layer for external contracts**
   - Stop leaking raw provider/API responses into broad UI surface

#### Work items
- Wrap global config access
- Define provider operation contract:
  - authenticate
  - open file
  - create file
  - save file
  - browse folder
  - share
- Normalize provider data to local models
- Route new interactions through adapters only
- Extract auth/session concerns from direct UI logic

#### Dependencies
- Quarter 1 architecture map
- Config contract
- Critical flow smoke pack

#### Decision gate
Proceed only if:
- Google/Dropbox flows remain stable
- Collaboration flow still intact
- No new feature must reach into raw provider internals

#### Improvement yield
- **Biggest win phase**
- **Risk reduction:** provider/auth changes no longer spray across app
- **Maintainability:** clearer ownership by layer
- **Velocity:** smaller edit surfaces
- **Replatform readiness:** new shell can reuse adapters

#### KPI effect
- Files touched per auth/provider change: down 30–50%
- Client regression risk in core flows: down 20–35%
- Time to reason about bug in provider flow: down 25–40%

---

### Quarter 3 — Tooling stabilization

#### Objectives
- Remove build fragility
- Improve reproducibility
- Lower environment/setup pain

#### Deliverables

1. **Sass modernization plan executed**
   - Move off dead Sass stack path
   - Visual diff checklist for SCSS output risk

2. **Dependency posture report**
   - Current deps
   - Obsolete deps
   - Freeze/replace/contain decisions

3. **Build contract**
   - Source inputs
   - Generated outputs
   - Ordering rules
   - Reproducibility expectations

4. **Asset ordering / source-of-truth**
   - Reduce hidden ordering risk in JS/CSS assembly

5. **Resource input strategy**
   - Plan for live JSON build dependency risk
   - Document cache/snapshot policy

#### Work items
- Separate "legacy but supported" from "must replace"
- Define path away from Bower-era assumptions
- Document current concat order and why it exists
- Add checks for missing config/resource/template inputs

#### Dependencies
- Seam work from Q2
- Validated smoke pack

#### Decision gate
Proceed only if:
- Build remains behavior-compatible
- Asset output expectations understood
- No hidden env-specific requirement remains undocumented

#### Improvement yield
- **Build stability:** fewer breakages from toolchain drift
- **Onboarding:** easier local setup
- **Operational stability:** reproducible outputs
- **Future migration:** easier to swap build pieces later

#### KPI effect
- Build/setup friction incidents: down 40–60%
- "Works on one machine only" class bugs: down sharply
- Time to recover broken client build: down 30–50%

---

### Quarter 4 — First visible modernization slice: preferences/options

#### Why preferences first
- Bounded UI
- High churn
- Lower data-loss risk than editor body
- Connected to seams created earlier
- Good proving ground for state/model boundaries

#### Deliverables

1. **New preferences/options slice**
   - Mounted inside legacy shell
   - Behavior parity
   - Uses new seams/contracts

2. **Interop contract**
   - Legacy shell ↔ new slice data flow
   - Event/command boundary
   - Rollback path

3. **Visual parity review**
   - Same capabilities
   - Acceptable UI deltas only

4. **Migration playbook**
   - Repeatable pattern for next slices

#### Work items
- Define state ownership for preferences
- Connect preferences to local domain models, not raw globals
- Replace direct DOM/event glue where slice touches new boundary
- Capture lessons learned for later slices

#### Dependencies
- Q2 seams
- Q3 build stability enough to support mixed world

#### Decision gate
Proceed only if:
- Slice ships without core editor regression
- Preference save/read/restart behavior stable
- Rollout/rollback path proven

#### Improvement yield
- **Visible modernization win**
- **Team confidence:** proves app can evolve incrementally
- **Maintainability:** one area exits legacy event soup
- **Replatform prep:** establishes migration template

#### KPI effect
- Change lead time for preferences area: down 40–60%
- Bugs caused by option UI coupling: down 25–40%
- Confidence in future slice migration: up materially

---

### Quarter 5+ — Expand slices, shrink legacy shell

#### Candidate next slices (ranked)
1. Flash/notifications
2. Account/subscription modals
3. File explorer
4. Selected auth UI surfaces
5. Editor chrome/menu
6. Editor core (last)

#### Objectives
- Expand proven pattern
- Retire dynamic behavior
- Shrink legacy shell to bootstrap/router only

#### Deliverables
- 2–3 more migrated slices
- Global/eval retirement list reduced
- Updated target architecture
- Framework choice decision for larger replatform phase

#### Improvement yield
- Cumulative risk drops
- Larger percentage of app on explicit contracts
- Eventual full replatform becomes feasible rather than scary

---

## 5) Improvement matrix by phase

| Phase | Main improvement | User-facing effect | Team effect | Strategic effect |
|---|---|---|---|---|
| Q1 Baseline | Visibility | Fewer surprise regressions | Faster diagnosis | Better roadmap control |
| Q2 Runtime seams | Safer core flows | More stable auth/save/collab | Smaller blast radius | Enables real migration |
| Q3 Tooling | Reliable builds | Fewer deployment/build issues | Faster setup, fewer build fires | Removes dead-stack risk |
| Q4 First slice | Proved modernization | Same behavior, cleaner preferences | Confidence + reusable pattern | Replatform path validated |
| Q5+ Expansion | Legacy reduction | More stable/consistent UI | Lower maintenance cost | Eventual full replatform realistic |

---

## 6) Priority backlog

### Highest priority
1. Config contract + access boundary
2. Provider/auth adapters
3. Editor controller responsibility split
4. Smoke pack for strategic flows
5. Sass/tooling modernization path

### Medium priority
6. Resource input reproducibility
7. Inline action/eval retirement in touched areas
8. Preferences slice migration
9. Flash/notification slice migration

### Lower priority
10. Large editor-body migration
11. Broad visual redesign
12. Deep monetization UI changes

---

## 7) Decision gates

### Gate A — after Q1
Ask:
- Do we understand actual runtime shape?
- Are hotspot and flow maps trusted?
- Are seams chosen correctly?

If no: do more discovery, not migration.

### Gate B — after Q2
Ask:
- Did change surface shrink?
- Are auth/provider/collab flows stable?
- Are adapters useful or ceremonial?

If no: stop slice work, repair seam design.

### Gate C — after Q3
Ask:
- Is build more reproducible?
- Did toolchain risk drop without behavior breakage?
- Can team support mixed legacy/new state?

If no: stabilize build before UI slice work.

### Gate D — after Q4
Ask:
- Did first slice reduce maintenance cost?
- Is migration pattern repeatable?
- Still need same future framework target?

If yes: expand slices.  
If no: reassess end-state strategy.

---

## 8) Risks and mitigations

### Risk: auth/provider regression
**Mitigation:** isolate early, validate every phase, avoid broad UI rewrites before seams.

### Risk: collaboration breakage
**Mitigation:** treat as protected strategic flow, no changes without explicit smoke pass, extract collaboration logic before UI changes around it.

### Risk: hidden dependency via globals/eval
**Mitigation:** inventory first, forbid new code from adding more globals/eval, retire only inside touched seams/slices.

### Risk: build/tool migration causes subtle CSS/asset drift
**Mitigation:** visual parity checks, phased tool swap, preserve output expectations where needed.

### Risk: team bandwidth too small
**Mitigation:** one major workstream per quarter, slice-based wins, no speculative refactors.

### Risk: roadmap becomes rewrite in disguise
**Mitigation:** every phase must ship value independently, rollback path required, no "stop world" phase.

---

## 9) KPI targets

### Engineering KPIs
- Lead time for medium client change: **down 30%** by Q4
- Files touched for typical preference/auth change: **down 40%** by Q4
- Onboarding time to safe client work: **≤ 1 day** by Q3
- Build failure/debug time: **down 40%** by Q3
- Hotfix rate for client regressions: **down 25%** by Q4

### Reliability KPIs
- No increase in auth/save/collab incident rate
- Smoke pass completion for all critical flows each phase
- Config-drift incidents trend toward zero

### Architecture KPIs
- Direct raw provider contract usage trending down each quarter
- Direct global config reads trending down
- Migrated slices count trending up
- `EditorController` responsibility count trending down

---

## 10) Ownership model

### Suggested roles
- **Roadmap owner** — sequence, decisions, acceptance
- **Client architecture owner** — seams/contracts
- **Validation owner** — smoke pack + regression sign-off
- **Feature owner per slice** — one slice at a time

One person can wear multiple hats. Important part = explicit ownership.

---

## 11) What improvement this yields

### For engineers
- Less fear touching client
- Fewer "where is this coming from?" bugs
- Less global-state archaeology
- Smaller review diffs
- Faster ramp-up

### For product/delivery
- Safer incremental modernization
- No rewrite freeze
- Visible progress every quarter
- Less fragility blocking features

### For operations/support
- Fewer auth/build surprises
- More predictable releases
- Easier root-cause analysis

### For long-term strategy
- Future framework move becomes option, not gamble
- App shifts from implicit legacy behavior to explicit contracts
- Core business flows protected while tech debt drops

---

## 12) Top 90-day recommendation

Do these first:

1. Architecture + hotspot map
2. Critical flow smoke pack
3. Config contract
4. Provider/auth/config seam design
5. Begin extraction around auth/provider/config
6. Define first slice contract for preferences

This sequence best matches:
- Biggest pain (unsafe change surface)
- Smallest-team reality
- Strategic flow protection
- Eventual replatform goal

---

## 13) Open decisions for later

- Final framework for replatform
- Long-term Dropbox investment after seam phase
- Exact cadence for later slice rollout
- Whether editor chrome or file explorer becomes second major slice

---

## 14) Design decisions and trade-offs

| Decision | Rationale |
|---|---|
| Seams before tooling | Biggest pain = unsafe surface; tooling benefits smaller early |
| Runtime seams before tooling | Auth/provider coupling higher risk than Sass deprecation |
| Preferences as first slice | Bounded, high churn, connected to seams, low data-loss risk |
| Keep both providers | User decision; adapters make this cheaper than splitting later |
| Modern evergreen browsers only | User decision; removes legacy compatibility tax |
| Behavior parity, internals flexible | User decision; enables aggressive internal change |
| Collaboration flagged strategic | User decision; must not regress, investment justified |
| Ads/paywall preserved as-is | User decision; touch only if modernization forces change |

---

## 15) File locations

This plan references the following source files extensively:

- `client/afn-app.sh` — build script
- `client/render.pl` — template renderer
- `client/app.tt` — main app template
- `client/editor-layout.tt` — editor layout template
- `client/assets/js/app-main.js.tt` — app startup template
- `client/assets/js/Controller/Editor.js` — EditorController (~420 lines)
- `client/assets/js/Controller/OAuth.js` — Google + Dropbox auth
- `client/assets/js/Router/Editor.js` — hash router
- `client/assets/js/Model.js` — custom Class inheritance system
- `client/assets/js/helpers.js` — globals, cookies, utilities
- `client/assets/js/HBRenderer.js` — Handlebars setup
- `client/assets/js/DataBinder.js` — DOM binding PubSub
- `client/assets/js/EventBinder.js` — eval-based event dispatch
- `client/assets/js/Nodel/` — CloudFile, Cache, User, AppSetting, etc.
- `client/assets/js/Widget/` — Preference, SelectSyntax, etc.
- `client/package.json` — npm deps (note: node-sass EOL)
- `client/bower.json` — bower deps (jquery 1.11, bootstrap 3.1.1)
- `client/_*.html` — Handlebars partial templates
- `client/menu-parts/` — menu sub-templates
- `client/assets/css/editor.css.scss` — main SCSS
- `client/assets/js/VARS.js.example` — config example (stale)

---

## 16) Measurements and success criteria

### After Q2
- Auth/provider regressions reduced
- Config key usage centralized
- Changes to provider integration require fewer files

### After Q3
- Build completes without node-sass
- New dev can build from fresh checkout with documented instructions
- Asset ordering documented and checked

### After Q4
- Preferences slice migrated without negative user impact
- Migration playbook exists for next slice
- Preference change leads reduced

### After Q5+
- At least 3 slices migrated
- `EditorController` lines reduced by 30%+
- Direct global usage in touched areas down 50%+

---

## 17) External references

- **Strangler Fig / incremental migration:** Vercel Academy — incremental migration guide. Carve routes/features, gate rollout, monitor metrics, remove legacy last.
- **Anti-corruption layer:** Tomasz Ducin — ACL in frontend. Map external API contracts into local domain models; isolate provider coupling behind thin adapters.
- **node-sass EOL (July 2024):** Official Sass blog. Node Sass archived; Dart Sass recommended.
- **LibSass EOL (October 2025):** Official Sass blog. No longer maintained; no future updates. Growing incompatibility with CSS features.
