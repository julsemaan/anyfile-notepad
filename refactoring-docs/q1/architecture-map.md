# Q1 Architecture Map

> **Purpose:** Make risk visible. Document startup path, template/render path, build path, controller/model hotspots, and global state map.
> **File:** `refactoring-docs/q1/architecture-map.md`

---

## 1. Startup path

The app boots in `editor-layout.tt` → inline scripts → `[% INCLUDE app.tt %]` → `app-main.js.tt`.

### Sequence

1. **HTML shell** (`editor-layout.tt`)
   - Loads CSS (`application.min.css`), JS (`application.min.js`), Ace editor, Google Ads, analytics
   - See: `client/editor-layout.tt:1-30`

2. **Google API bootstrap** (`editor-layout.tt:42-52`)
   - Two script blocks inject Google client + GSI:
     ```html
     <script src="https://apis.google.com/js/client.js?onload=gapi_loaded"></script>
     <script src="https://accounts.google.com/gsi/client" onload="gsi_loaded()" async defer></script>
     ```
   - `gapi_loaded()` calls `application.controllers.google_oauth.init()` — this means **boot waits on Google auth** before preferences can load.

3. **Application controller + i18n** (`app-main.js.tt:1-45`)
   - Creates `application = new ApplicationController()`
   - Injects locale data via Template Toolkit `[% FOREACH %]`
   - Defines `i18n()` global
   - Builds template `context` object with locales, syntaxes, themes
   - Creates `HBRenderer` and calls `renderAll(context)` — renders all `data-hb-template` partials

4. **Auth controllers** (`app-main.js.tt:45-50`)
   - `DropboxOAuthController` instantiated
   - `GoogleOAuthController` created with Drive scopes

5. **Preferences blocking** (`app-main.js.tt:64-67`)
   - Preferences are queued behind Google OAuth init:
     ```js
     application.controllers.google_oauth.add_to_queue(function(){
       user_preferences = new Preferences(...)
     ```
   - Preferences constructor calls `get_from_drive()` which queries Google Drive `appfolder`

6. **Editor controller + UI** (`app-main.js.tt:67-110`)
   - EditorController created with preferences, flash, file explorer, favorites, recent files
   - PreferencesController created
   - MenuController, TopMenuController created
   - EditorRouter created (hash-based routing)
   - Ads / privacy / terms flash messages appended
   - Dev mode, locale selection set up

7. **Router dispatch** — see `client/assets/js/Router/Editor.js`
   - Listens to `hashchange` event
   - Routes like `#new/GoogleDrive`, `#open/Dropbox`, `#file/...`
   - Uses `sessionStorage.google_auth_return_to` for post-auth redirect

### Key observation
- **Preferences cannot load before Google OAuth.** Dropbox users also wait on Google auth.
- Global `i18n()` and `application` are available globally before any controller is fully initialized.

---

## 2. Template / Render path

Two template systems coexist:

### Template Toolkit (Perl) — server-side
- **Entry:** `editor-layout.tt` — the HTML shell
- **Includes:** `app.tt`, `analytics.tt`, ad scripts
- **Dynamic injection:** `APP_VERSION_ID`, `SYNTAXES_JSON`, `THEMES_JSON`, `WITH_ADS`, locale data
- **Build step:** `render.pl` processes `editor-layout.tt` into `app.html` and `app-plus-plus.html`
- **Location:** `client/render.pl`

### Handlebars — client-side
- **Renderer:** `HBRenderer.js` — wraps Handlebars.compile for `data-hb-template` elements
- **Templates:** `client/_*.html` files — prefixed with underscore
- **Partial assembly:** `find . -name '_*.html'` → concat into `app.partials`
- **Menu parts:** `client/menu-parts/` — sub-templates included by Handlebars
- **Context:** built in `app-main.js.tt` from globals like `application`, `ace`, `locales`, `grouped_syntaxes`
- **Binding:** `HBRenderer.js` sets `data-eb-click` attribute for event binding

### DataBinder (custom PubSub)
- `DataBinder.js` — DOM-to-model binding
- Attributes like `data-bind-*` connect DOM elements to model properties
- Used in preferences, UI state

### EventBinder (eval-based dispatch)
- `EventBinder.js:2-6` — catches `click` on `[data-eb-click]` elements
- Extracts `data-eb-click` attribute value
- Calls `eval(action)` on the attribute text

---

## 3. Build path

### Build script: `client/afn-app.sh`

**Steps:**

1. **Set up** — `APP_VERSION_ID` from `date | sha1sum`, create output dir in `tmp/app-compiled/`
2. **Delete cache** — `rm -fr tmp/cache/`
3. **Ace build** — `ace_js()` — builds Ace editor from `bower_components/ace-anyfile-notepad/`
4. **Pages CSS** — `pages_css()` — copies bootstrap CSS → SCSS include, node-sass compile
5. **Application CSS** — `application_css()` — concatenates bootstrap + tether-shepherd + jqueryFileTree + node-sass compile of `editor.css.scss`
6. **Application JS** — `application_js()` — concatenates vendor JS + explicit-order manual files + `find assets/js/ -name '*.js'` remaining files
7. **Editor partials** — `editor_part()` — `find . -name '_*.html'` → concatenated partials
8. **App render** — `app()` — copies `editor-layout.tt`, runs `render.pl`

### Key risks
- **`node-sass`** — EOL (July 2024), LibSass EOL (October 2025). Used for both `application.css` and `pages.css`.
- **`find` ordering implicit** — `find assets/js/ -name '*.js'` after manual list — order depends on filesystem, not explicit.
- **Live JSON fetch** — `render.pl` expects `SYNTAX_DB` JSON file; this is downloaded from live API URLs into `tmp/cache/`.
- **Bower dependencies** — jquery 1.11, bootstrap 3.1.1, ace-anyfile-notepad (custom fork).

---

## 4. Controller / Model hotspots

| File | Lines | Role |
|------|-------|------|
| `Controller/Editor.js` | 761 | Main editor lifecycle: new/open/save/autosave, collaboration, encoding, download, locale |
| `Controller/OAuth.js` | 247 | Google + Dropbox OAuth: token management, API execute, session storage, cookie fallback |
| `Router/Editor.js` | 187 | Hash-based routing: new/open/save file dispatch, auth return routing |
| `Model.js` | 174 | Custom OOP class system: `Model()` constructor, `Model.define()`, `eval`-based inheritance |
| `Model/Preferences.js` | 153 | Preferences stored in Google Drive appfolder, Cache-backed |

### Other notable files

| File | Lines | Role |
|------|-------|------|
| `Controller/FileExplorer.js` | 140 | Google Picker integration, file browsing UI |
| `Controller/Application.js` | 136 | App-level state: dev mode, upgrade prompts, version handling |
| `helpers.js` | 237 | Globals: `getCookie`, `setCookie`, `DEFAULT_PROVIDER`, utility functions |
| `DataBinder.js` | 75 | DOM-model PubSub binding |
| `HBRenderer.js` | 85 | Handlebars render wrapper + `data-eb-click` helper |
| `EventBinder.js` | 10 | `[data-eb-click]` click dispatch via `eval` |

### Key domain files under `Model/` and `Nodel/`

| File | Role |
|------|------|
| `Nodel/CloudFile.js` | Cloud file operations, collaboration events |
| `Nodel/Cache.js` | localStorage-based cache |
| `Nodel/User.js` | User ID from sessionStorage, cookie for Google user |
| `Nodel/AppSetting.js` | Reads from `AFN_VARS["afn_api_uri"]` |
| `Nodel/Stat.js` | Stats endpoint from `AFN_VARS["afn_api_uri"]` |
| `Nodel/MimeType.js` | MIME type API resource |
| `Nodel/Extension.js` | Extension API resource |
| `Nodel/Syntax.js` | Syntax API resource |
| `Widget/Preference.js` | UI widget for preferences |
| `Widget/SelectTheme.js` | Theme selector with dark mode detection |

---

## 5. Global state map

### `window.AFN_VARS` — configuration object
Defined in `client/assets/js/VARS.js` (generated/secret). Keys used at runtime:

| Key | Used in | Purpose |
|-----|---------|---------|
| `api_uri` | MimeType, Extension, Syntax models | Base API URL |
| `afn_api_uri` | AppSetting, Stat models | API URL for settings + stats |
| `google_client_id` | OAuth.js, FileExplorer.js | Google OAuth client ID |
| `drive_app_id` | OAuth.js | Google Drive app ID |
| `google_picker_api_key` | FileExplorer.js | Google Picker API key |
| `dropbox_key` | OAuth.js | Dropbox app key |
| `collab_uri` | CloudFile.js | Collaboration API base URL |
| `stripe_key` | `_upgrade.html` template | Stripe publishable key |

**Mismatch:** `VARS.js.example` defines `api_uri`, `google_client_id`, `drive_app_id`, `dropbox_key`, `stripe_key`, `collab_uri` — but **not** `afn_api_uri` or `google_picker_api_key`.

### `application` — global ApplicationController instance
Created in `app-main.js.tt`. Accessible as `application.*` everywhere. Holds:
- `application.controllers.editor` — EditorController
- `application.controllers.google_oauth` — GoogleOAuthController
- `application.controllers.dropbox_oauth` — DropboxOAuthController
- `application.controllers.editor.preferences_controller`
- `application.controllers.editor.top_menu`
- `application.controllers.editor.flash`
- `application.controllers.editor.file_explorer`
- `application.controllers.editor.favorites_controller`
- `application.controllers.editor.recent_files_controller`
- `application.controllers.editor.editor_model_bind_controller`

### `window.classes` — class registry
Created by `Model.js:161` via `eval`. Contains all `Model.define`-registered classes.

### `window.*` — leaked controller constructor names
`Router/Editor.js:40` does `window[model] = self.controller.models[model]`, leaking model constructors.

### `window.i18n` — global i18n function

### `window.Handlebars`, `window.RSVP`, `window.gapi`, `window.Dropbox`, `window.ace` — third-party globals

### `document.cookie` — used for:
- `access_token`, `dropbox_access_token` — OAuth tokens
- `started-date`, `asked-review-date` — first-use tracking
- `last_hash_url` — last editor route
- `locale` — user locale preference
- `AFNVersion` — dev mode toggle
- `current_google_user_id` — Google user identity
- `propose-upgrade-count` — subscription upsell tracking

### `sessionStorage` — used for:
- `access_token` — Google OAuth access token
- `google_auth_return_to` — post-auth redirect URL
- `hasAuthedOnce` — first-auth flag
- `current_user_id` — cached user ID

### `localStorage` — used for:
- Cache namespace via `Cache.js` — preferences, file metadata

---

## 6. Architecture diagram (text)

```
                       editor-layout.tt (HTML shell)
                              │
                     ┌────────┴────────┐
                     │                 │
                app.tt          analytics.tt + ads
                     │
              app-main.js.tt (boot script)
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
   Application  HBRenderer   DropboxOAuth   GoogleOAuth
   Controller   renderAll    Controller     Controller
        │            │                         │
        │    Handlebars partials          add_to_queue
        │    (_*.html, menu-parts/)           │
        │                                 Preferences
        │                              (Google Drive appfolder)
        │                                    │
        └────────────┬─────────────────── EditorController
                     │                (761 lines, main lifecycle)
                EditorRouter
           (hash routing + dispatch)
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
   FileExplorer   Flash      Favorites      RecentFiles
   (Google Picker)  Controller   Controller     Controller
```

---

## 7. Key file references

| Path | Evidence |
|------|----------|
| `client/editor-layout.tt:42-52` | Google API bootstrap blocks boot on auth |
| `client/assets/js/app-main.js.tt:45-115` | Full boot sequence, pref queue, controller creation |
| `client/afn-app.sh:146-227` | Build script — CSS/JS/partial assembly + render |
| `client/render.pl` | Two-pass TT render (`app.html`, `app-plus-plus.html`) |
| `client/assets/js/Controller/Editor.js` (761 lines) | Largest hotspot |
| `client/assets/js/Controller/OAuth.js` (247 lines) | Auth hotspot |
| `client/assets/js/Router/Editor.js` (187 lines) | Router hotspot |
| `client/assets/js/Model.js` (174 lines) | Class system with eval |
| `client/assets/js/Model/Preferences.js` (153 lines) | Drive-tied preferences |
| `client/assets/js/EventBinder.js:2-6` | eval-based event dispatch |
| `client/assets/js/helpers.js:4-17` | Cookie get/set, DEFAULT_PROVIDER global |
| `client/assets/js/VARS.js.example` | Stale config example (missing `afn_api_uri`, `google_picker_api_key`) |
