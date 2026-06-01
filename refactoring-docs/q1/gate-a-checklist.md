# Gate A Checklist

> **Purpose:** Decision gate after Q1. If all answers are "yes", proceed to Q2 (runtime seams). If any "no", do more discovery.
> **File:** `refactoring-docs/q1/gate-a-checklist.md`

---

## Gate A: Proceed to Q2?

### 1. Are top 5 hotspots agreed?

Based on architecture map analysis:

| Rank | Hotspot | Lines | Reason |
|------|---------|-------|--------|
| 1 | `Controller/Editor.js` | 761 | Main editor lifecycle. Touched by 4+ critical flows. |
| 2 | `Controller/OAuth.js` | 247 | Google + Dropbox auth, token management, session storage. |
| 3 | `Router/Editor.js` | 187 | Hash routing, auth return, model leak to window. |
| 4 | `Model.js` | 174 | eval-based class system, foundational coupling. |
| 5 | `Model/Preferences.js` | 153 | Drive-tied preferences, blocks Dropbox-only flow. |

**Check:** [ ] Yes, these are the top 5 change-risk hotspots.

**If no:** Identify corrections and update `architecture-map.md`.

---

### 2. Are top 5 critical flows agreed?

Based on critical flows analysis:

| Rank | Flow | Key risk |
|------|------|----------|
| 1 | Google auth | Boot blocker, token management, cookie + sessionStorage |
| 2 | Dropbox auth | Preferences still need Google, cookie-only token |
| 3 | New/Open/Save | Provider API coupling, 761-line controller |
| 4 | Autosave | Mixed with collaboration logic, eval-based toggling |
| 5 | Preferences | Google Drive lock-in, localStorage cache |

**Check:** [ ] Yes, these are the 5 flows that must never regress.

**If no:** Add/remove flows and update `critical-flows-and-smoke-pack.md`.

---

### 3. Is config contract documented?

Based on config contract analysis:

- All 8 runtime keys cataloged? **[documented in `config-contract.md`]**
- Missing keys identified: `afn_api_uri`, `google_picker_api_key`? **[yes]**
- VARS.js.example mismatch known? **[yes, documented]**
- CI injection points understood? **[needs workflow file audit]**

**Check:** [ ] Config contract complete and accurate.

**If no:** Complete config audit before seam work. Missing keys are the highest-risk gap.

---

### 4. Are seam boundaries accepted?

Based on seam design analysis:

| Seam | Scope | Acceptance criteria |
|------|-------|---------------------|
| Config access | One wrapper for all `AFN_VARS` reads | 12 raw reads → 1 service |
| Auth/session | Token mgmt, cookie, sessionStorage | No ad-hoc persistence access |
| Provider ops | Google Drive + Dropbox file operations | Uniform adapter interface |
| Domain adapters | File, user, preferences, syntax | Normalized models |

**Check:** [ ] Seam boundaries accepted as Q2 extraction targets.

**If no:** Discuss and revise seam scope in `seam-design.md`.

---

## 5. Additional discovery questions

### 5a. Are coupling inventories reliable?

- [ ] Grep results for `AFN_VARS`, `sessionStorage`, `localStorage`, `eval`, `onclick`, `data-eb-click` reviewed
- [ ] No additional coupling patterns found (e.g., global event bus, dynamic script loading)
- [ ] Template inventory (`find . -name '_*.html'`) matches partial assembly in build script

### 5b. Is the smoke pack executable?

- [ ] All smoke checks are verifiable in dev stack
- [ ] Test accounts exist for Google + Dropbox
- [ ] Known test files in both providers exist
- [ ] Collaboration test environment available

### 5c. Are there any unexamined risk areas?

- [ ] `minify` step in build script? (runs during `is_webdev` check)
- [ ] Google Ads / DFP integration? (external JS, no fallback)
- [ ] Ace editor custom fork version? (`bower_components/ace-anyfile-notepad`)
- [ ] `RSVP` Promise polyfill version? (`libs/rsvp.min.js`)
- [ ] `Handlebars` version? (`libs/handlebars.js`)
- [ ] `route-recognizer` router library version? (`libs/route-recognizer.js`)

---

## Decision

| Question | Yes/No | Action |
|----------|--------|--------|
| Top 5 hotspots agreed? | □ Yes □ No | If no: revise architecture map |
| Top 5 flows agreed? | □ Yes □ No | If no: revise critical flows |
| Config contract complete? | □ Yes □ No | If no: complete config audit |
| Seam boundaries accepted? | □ Yes □ No | If no: discuss and revise |

**Gate A result:** □ PROCEED to Q2 □ DO MORE DISCOVERY

---

## If "do more discovery" — suggested next steps

1. **Template/partial inventory** — full list of `client/_*.html` files, their included sub-partials, and the controllers they reference
2. **Third-party dependency audit** — versions, licenses, maintenance status for bower/npm deps
3. **Build ordering analysis** — determine if JS/CSS concat order is deterministic
4. **Provider API surface audit** — document every Google Drive and Dropbox API call made by the app
5. **Collaboration protocol audit** — document collab endpoint contracts and polling behavior
