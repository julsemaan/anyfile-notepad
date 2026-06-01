# Q1 Critical Flows + Smoke Validation Pack

> **Purpose:** Document critical user-facing flows and provide manual pass/fail checks. Execute smoke pack per phase to catch regressions.
> **File:** `refactoring-docs/q1/critical-flows-and-smoke-pack.md`

---

## 1. Critical flows

Seven flows are business-critical. Any change must not regress these.

---

### Flow 1: Google auth

**User story:** User signs in with Google account.

**Source files:**
- `client/assets/js/Controller/OAuth.js` — `GoogleOAuthController` class (lines 1-165)
- `client/editor-layout.tt:42-52` — Google API script injection
- `client/assets/js/Router/Editor.js:121` — auth return routing
- `client/assets/js/helpers.js` — `getCookie`/`setCookie` for token persistence

**Mechanism:**
1. `editor-layout.tt` loads `apis.google.com/js/client.js` with `onload=gapi_loaded`
2. `gapi_loaded()` calls `GoogleOAuthController.init()`
3. Token read from `sessionStorage.access_token`, fallback to cookie `access_token`
4. `gapi.client.setToken()` sets the token
5. Auth return URL stored in `sessionStorage.google_auth_return_to`
6. On token expiry, redirects to Google OAuth consent screen

**Key coupling:**
- Boot waits for Google API to load before preferences can load
- Token stored in both `sessionStorage` and cookie (redundant)
- Dropbox flow also uses this infrastructure indirectly for preferences

**Smoke checks:**
- [ ] New tab: Google auth prompt appears
- [ ] After auth: app loads fully, preferences saved
- [ ] Page refresh: session restored without re-auth (token cookie/SessionStorage)
- [ ] Token expiry: redirects to auth
- [ ] Switch user: works from user menu

---

### Flow 2: Dropbox auth

**User story:** User signs in with Dropbox account.

**Source files:**
- `client/assets/js/Controller/OAuth.js:166-247` — `DropboxOAuthController`
- `client/assets/js/Model/Preferences.js:32` — still uses Google Drive even for Dropbox auth
- `client/assets/js/Router/Editor.js:117` — default routing

**Mechanism:**
1. Dropbox SDK `new Dropbox({ clientId: AFN_VARS['dropbox_key'] })`
2. Token from `getCookie("dropbox_access_token")`
3. `setCookie("dropbox_access_token", token)` on auth

**Key coupling:**
- Preferences still stored in **Google Drive appfolder** even when authenticated via Dropbox
- Dropbox token persisted via cookie only (no sessionStorage)

**Smoke checks:**
- [ ] Dropbox auth prompt works
- [ ] After auth: file list loads from Dropbox
- [ ] Open/save from Dropbox works
- [ ] Page refresh: session restored
- [ ] Preferences still work (stored in Google Drive, separate auth)

---

### Flow 3: New / Open / Save

**User story:** User creates, opens, and saves files.

**Source files:**
- `client/assets/js/Controller/Editor.js` (761 lines) — main lifecycle
- `client/assets/js/Router/Editor.js` — route dispatch
- `client/assets/js/Nodel/CloudFile.js` — cloud file operations
- `client/assets/js/Controller/FileExplorer.js` — file browser via Google Picker

**Mechanism:**
1. Router dispatches on `location.hash`: `#new/GoogleDrive`, `#open/Dropbox`, `#file/{id}`
2. EditorController creates/opens file via provider API
3. File content loaded into Ace editor
4. Save writes back via provider API

**Key coupling:**
- `EditorController` directly calls provider APIs (Google Drive, Dropbox)
- Save/autosave logic mixed with collaboration logic
- File encoding handling mixed with editor lifecycle

**Smoke checks:**
- [ ] New file in Google Drive: file created, opens in editor
- [ ] New file in Dropbox: file created, opens in editor
- [ ] Open file from Google Drive: loads content, sets syntax
- [ ] Open file from Dropbox: loads content, sets syntax
- [ ] Save file: writes back to provider, no data loss
- [ ] Save as/new name: creates new file copy
- [ ] Download: triggers browser download
- [ ] Encoding handling with non-UTF-8 files

---

### Flow 4: Autosave

**User story:** Editor auto-saves work at intervals.

**Source files:**
- `client/assets/js/Controller/Editor.js` — autosave activation, interval
- `client/assets/js/Controller/Editor.js:63` — inactivity restart interval
- `client/editor-menu.tt:43-44` — autosave toggle UI (`data-eb-click`)

**Mechanism:**
1. Autosave enabled/disabled via menu toggle
2. `editor.activate_autosave(true)` / `editor.deactivate_autosave()`
3. Periodic save triggers on provider API

**Smoke checks:**
- [ ] Toggle autosave ON: indicator shows
- [ ] Toggle autosave OFF: indicator shows
- [ ] Autosave fires: file saved without user action
- [ ] No data loss on browser refresh with pending autosave
- [ ] Autosave respects network errors gracefully

---

### Flow 5: Collaboration

**User story:** Multiple users edit same file in real time.

**Source files:**
- `client/assets/js/Nodel/CloudFile.js:163,180` — collaboration event endpoints
- `client/assets/js/Controller/Editor.js` — collaboration logic mixed in
- `client/assets/js/helpers.js` — utility functions

**Mechanism:**
1. File opened with collaboration ID
2. Polls `collab_uri` for realtime events
3. Sends local changes via POST to collab API

**Key coupling:**
- Collaboration logic deeply intertwined with EditorController save/load
- `AFN_VARS["collab_uri"]` read directly in CloudFile.js
- No dedicated collaboration adapter

**Smoke checks:**
- [ ] Open file with collaboration: events poll correctly
- [ ] Two users editing: changes sync bidirectionally
- [ ] Disconnect/reconnect: resumes polling
- [ ] No duplicate events or data corruption

---

### Flow 6: Preferences

**User story:** User customizes editor options.

**Source files:**
- `client/assets/js/Model/Preferences.js` (153 lines) — Drive-backed preferences
- `client/assets/js/Widget/Preference.js` — preference UI widget
- `client/assets/js/Controller/Editor.js` — preference controller setup
- `client/menu-parts/options/` — preference UI templates
- `client/assets/js/DataBinder.js` — DOM-model binding for pref values

**Mechanism:**
1. Preferences stored as a JSON file in Google Drive `appfolder`
2. `Cache.js` wraps preferences in `localStorage` for speed
3. Preference types: `StringPreference`, `IntPreference`, `ArrayPreference`
4. UI bound via `DataBinder.js` attributes

**Key coupling:**
- **Preferences require Google auth** — even Dropbox users must auth Google
- Preferences file stored in provider-specific location (Google Drive appfolder)
- Cache layer uses `localStorage` directly

**Smoke checks:**
- [ ] Open preferences UI: loads current values
- [ ] Change theme: applies immediately, persists on refresh
- [ ] Change menu width: resizes, persists
- [ ] Change locale: updates UI language
- [ ] Change editor font size: applies
- [ ] Preference persistence across page reloads
- [ ] Works when offline (cache fallback)
- [ ] Reset preferences to defaults works

---

### Flow 7: Ads / Paid variant

**User story:** Free users see ads; paid users get ad-free.

**Source files:**
- `client/editor-layout.tt` — AdSense/DFP ad slots
- `client/render.pl` — renders `app.html` (WITH_ADS=1) and `app-plus-plus.html` (WITH_ADS=0)
- `client/assets/js/app-main.js.tt:103` — upgrade flash message
- `client/assets/js/Controller/Application.js:116-134` — upgrade prompt counting
- `client/_upgrade.html` — upgrade modal
- `webserver/` — subscription/session logic rewrites between variants

**Key coupling:**
- Ad variant baked into build output (two separate HTML files)
- Session logic on webserver chooses variant based on subscription status
- Upgrade prompt uses cookie counting (`getCookie("propose-upgrade-count")`)
- Stripe key read from template (`data-key="{{ global_context.window.AFN_VARS.stripe_key }}"`)

**Smoke checks:**
- [ ] Free user: ad slots visible, upgrade flash shown
- [ ] Paid user: no ads, no upgrade prompt
- [ ] Upgrade flow: Stripe checkout works
- [ ] After upgrade: page refresh serves `app-plus-plus.html`
- [ ] Upgrade prompt frequency respected (cookie-based throttle)

---

## 2. Smoke validation pack

Manual or lightweight scripted checks per phase.

### Setup
- Firefox or Chrome, logged into Google + Dropbox test accounts
- Local dev stack running (or production-like environment)
- Known test files in both providers

### Pre-flight
- [ ] App loads without JS console errors
- [ ] All file sources reference correct version IDs
- [ ] Templates render without missing partials

### Auth
- [ ] Google auth: sign in, app loads
- [ ] Dropbox auth: sign in, app loads
- [ ] Session restore on page refresh (both providers)
- [ ] Token expiry handled gracefully (redirect to auth)

### File operations
- [ ] New file (Google Drive): create, edit, save, reopen
- [ ] New file (Dropbox): create, edit, save, reopen
- [ ] Open existing file (both providers)
- [ ] Save (Ctrl+S) works
- [ ] Download file works
- [ ] File encoding detection works for UTF-8, Latin-1, etc.

### Autosave
- [ ] Toggle ON: saves automatically
- [ ] Toggle OFF: no auto-save
- [ ] Refresh with unsaved changes: no data loss (autosave recovery)

### Collaboration
- [ ] Open shared file: collaboration events visible
- [ ] Concurrent edits sync correctly
- [ ] Disconnect/reconnect: resumes

### Preferences
- [ ] Change a preference, refresh: persists
- [ ] All preference types: string, int, array (favorites, recent files)
- [ ] Theme preference changes editor look

### Monetization
- [ ] Ad slots render (free user)
- [ ] Upgrade modal opens
- [ ] Paid variant: no ads, no upgrade prompts

### Browser compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (Chromium)

---

## 3. Flow-to-source mapping

| Flow | Primary files | Supporting files |
|------|---------------|------------------|
| Google auth | `Controller/OAuth.js:1-165` | `editor-layout.tt:42-52`, `Router/Editor.js:121`, `helpers.js` |
| Dropbox auth | `Controller/OAuth.js:166-247` | `Router/Editor.js:117`, `helpers.js` |
| New/Open/Save | `Controller/Editor.js`, `Router/Editor.js`, `Nodel/CloudFile.js` | `Controller/FileExplorer.js` |
| Autosave | `Controller/Editor.js` | `editor-menu.tt:43-44`, `EventBinder.js` |
| Collaboration | `Nodel/CloudFile.js:163,180` | `Controller/Editor.js` |
| Preferences | `Model/Preferences.js`, `Widget/Preference.js` | `DataBinder.js`, `Cache.js`, `menu-parts/options/` |
| Ads/Paid | `render.pl`, `Controller/Application.js` | `editor-layout.tt`, `_upgrade.html`, `webserver/` |

---

## 4. Regression risk hotspots

Files touched by ≥3 flows:

| File | Flows |
|------|-------|
| `Controller/Editor.js` (761 lines) | New/Open/Save, Autosave, Collaboration, Preferences |
| `Controller/OAuth.js` (247 lines) | Google auth, Dropbox auth, Preferences (indirect) |
| `Router/Editor.js` (187 lines) | Google auth, Dropbox auth, New/Open/Save |
| `Nodel/CloudFile.js` | New/Open/Save, Collaboration |
| `helpers.js` | Google auth, Dropbox auth, Ads |
