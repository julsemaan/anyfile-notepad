# Q1 Seam Design

> **Purpose:** Define seam boundaries for future extraction. Document what to wrap, how to wrap, and the hard coupling that makes it risky.
> **File:** `refactoring-docs/q1/seam-design.md`

---

## 1. Seam boundaries (conceptual)

Four primary seams needed:

```
┌─────────────────────────────────────────────────────────┐
│                     Legacy Client                         │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Config   │  │ Auth /   │  │ Provider │  │ Domain   │  │
│  │ Access   │  │ Session  │  │ Ops      │  │ Adapters │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Hard-coded dependencies                │  │
│  │  (globals, eval, inline onclick, cookies, etc.)    │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Each seam is a thin wrapper that:
- Provides a single, documented API
- Isolates the rest of the app from implementation details
- Can be replaced behind the same interface later

---

## 2. Seam 1: Config access

### What it wraps
All `window.AFN_VARS` reads.

### Current coupling (12 raw reads across 10 files)
- `OAuth.js:3-4,169` — `google_client_id`, `drive_app_id`, `dropbox_key`
- `FileExplorer.js:117-118` — `google_client_id`, `google_picker_api_key`
- `MimeType.js:12`, `Extension.js:12`, `Syntax.js:12` — `api_uri`
- `AppSetting.js:5`, `Stat.js:15` — `afn_api_uri`
- `CloudFile.js:163,180` — `collab_uri`
- `_upgrade.html:43` — `stripe_key` (template)

### Interface proposal

```js
// Service
ConfigService.get('api_uri')
ConfigService.get('google_client_id')
ConfigService.getAll()  // returns whole object for debugging
ConfigService.has('key')  // validation check
```

### Migration pattern
1. Create `ConfigService` wrapper
2. Replace each `AFN_VARS["..."]` with `ConfigService.get("...")`
3. Add boot validation that all required keys exist
4. Later: replace implementation (e.g., fetch from backend)

---

## 3. Seam 2: Auth / Session

### What it wraps
- OAuth token management
- Cookie + sessionStorage persistence
- Auth flow control

### Current coupling
- `OAuth.js:27-34` — token read from sessionStorage → cookie fallback
- `OAuth.js:49` — `sessionStorage.google_auth_return_to`
- `OAuth.js:80-81` — `setCookie('access_token')` + `sessionStorage.access_token`
- `OAuth.js:117` — `sessionStorage.access_token` for API calls
- `OAuth.js:172,191` — Dropbox token cookie
- `Router/Editor.js:21,117,121` — hash cookie + auth return routing
- `Nodel/User.js:30,38,59` — user ID sessionStorage + cookie

### Interface proposal

```js
// Service
AuthService.getAccessToken()      // unified token retrieval
AuthService.setAccessToken(token) 
AuthService.getAuthReturnUrl()
AuthService.setAuthReturnUrl(url)
AuthService.getProvider()         // 'google' | 'dropbox'
AuthService.getCurrentUserId()
AuthService.onAuthChange(callback)
```

### Migration pattern
1. Create `AuthService` that abstracts token persistence
2. Replace `sessionStorage` / cookie access in OAuth.js
3. Create provider-specific subclasses/adapters for Google + Dropbox
4. Normalize auth return routing through seam

---

## 4. Seam 3: Provider ops

### What it wraps
File operations against Google Drive and Dropbox APIs.

### Current coupling
- `EditorController` directly calls provider APIs for open/save
- `FileExplorer.js` uses Google Picker directly
- `CloudFile.js` has mixed provider logic
- No uniform file operation model

### Interface proposal

```js
// Adapter
class ProviderAdapter {
  authenticate() {}
  openFile(fileId) {}
  createFile(filename, content) {}
  saveFile(fileId, content) {}
  deleteFile(fileId) {}
  listFiles(query) {}
  browseFolder() {}  // provider-specific picker
  getFileMetadata(fileId) {}
}

// Concrete adapters
class GoogleDriveAdapter extends ProviderAdapter {}
class DropboxAdapter extends ProviderAdapter {}
```

### Current hard coupling
- `Preferences.js:32,61-69` — preferences stored in Google Drive appfolder, **cannot work with Dropbox alone**
- `Controller/Editor.js` — save logic mixed with collaboration logic
- `Nodel/CloudFile.js` — provider API calls directly in model

---

## 5. Seam 4: Domain adapters

### What it wraps
Domain-specific logic that currently lives in models but has provider/config coupling.

### Sub-adapters needed

#### File adapter
- Normalize file metadata (title, content, encoding, syntax)
- `AFN_VARS["api_uri"]` calls for extension/mime/syntax lookup
- `client/assets/js/Nodel/CloudFile.js`

#### Preferences adapter
- Read/write preferences (currently Google Drive appfolder)
- Cache via localStorage
- `client/assets/js/Model/Preferences.js`
- `client/assets/js/Widget/Preference.js`

#### User adapter
- User identity persistence
- Current coupling via `Nodel/User.js` (sessionStorage + cookie)
- `client/assets/js/Nodel/User.js`

#### Syntax adapter
- Syntax list from API
- `client/assets/js/Nodel/Syntax.js`

---

## 6. Key hard coupling problems (why extraction is risky)

### Problem 1: Boot waits on Google auth

`editor-layout.tt:47`:
```js
function gapi_loaded(){
  application.controllers.google_oauth.init();
}
```

`app-main.js.tt:64-67`:
```js
application.controllers.google_oauth.add_to_queue(function(){
  user_preferences = new Preferences(...)
```

**Consequence:** Preferences, EditorController, and all downstream features are blocked until Google API loads and OAuth initializes. This affects Dropbox users too.

### Problem 2: Preferences tied to Google Drive appfolder

`Preferences.js:32`:
```js
this.get_from_drive()
```

`Preferences.js:61-69`:
```js
var request = gapi.client.drive.files.list({
  'q': '\'appfolder\' in parents'
});
```

**Consequence:** Even if a user authenticates via Dropbox, preferences still need Google auth. The seam must either provide a fallback (localStorage-only) or ensure Google is always available.

### Problem 3: eval-based class system

`Model.js:120,136,165`:
```js
eval("object = new "+self.model_name+"(object)")
eval("object = new "+self.model_name+"(object)")
eval(creator);
```

**Consequence:** No static analysis can determine class relationships. Any extraction that touches models needs careful testing.

### Problem 4: Inline action cascade

Templates directly reference `application.controllers.*`:
- `_about.html` → `application.stop_dev_mode()`
- `_flash.html` → `application.controllers.editor.flash.toggle_maximize()`
- `_unknown_encoding.html` → `application.controllers.editor.preferences_controller.handle_add_known_ext(this)`
- Menu items → `application.controllers.editor.top_menu.action_and_close(...)`

**Consequence:** Renaming or restructuring controllers breaks templates silently.

---

## 7. Priorities for extraction

| Seam | Priority | Rationale |
|------|----------|-----------|
| Config access | **P0** | Smallest change surface, lowest risk, enables all other extraction |
| Provider ops | **P0** | Protects critical flows (open/save), reduces blast radius of API changes |
| Auth/session | **P1** | Complex but high value; token management is fragile |
| Domain adapters | **P2** | Depends on config + provider seams; preferences adapter needs config cleanup first |

---

## 8. Migration rules

1. **New code goes through seams.** No new code should read `AFN_VARS` directly, use `eval`, or access `sessionStorage`/`localStorage`/cookies directly.
2. **Seams are optional for legacy callers.** Don't force migration of all old code at once.
3. **Seam interface > implementation.** Define contract first, implement simply, replace later.
4. **Each seam must be independently testable.** Mock the interface, not the global.
5. **Seam extraction must not change app behavior.** Behavior parity is mandatory.
