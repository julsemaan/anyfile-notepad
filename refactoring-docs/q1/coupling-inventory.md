# Q1 Coupling Inventory

> **Purpose:** Catalog every form of hidden coupling in the client codebase: `AFN_VARS` reads, `window` usage, cookies, `sessionStorage`, `localStorage`, inline `onclick`, `data-eb-click`, `eval`.
> **File:** `refactoring-docs/q1/coupling-inventory.md`

---

## 1. `AFN_VARS` reads (config coupling)

Every runtime config value is read ad-hoc from `window.AFN_VARS`. No wrapper or seam.

| File | Line | Expression |
|------|------|------------|
| `Controller/OAuth.js` | 3 | `this.client_id = AFN_VARS['google_client_id']` |
| `Controller/OAuth.js` | 4 | `this.drive_app_id = AFN_VARS['drive_app_id']` |
| `Controller/OAuth.js` | 169 | `this.client = new Dropbox({ clientId: AFN_VARS['dropbox_key']})` |
| `Controller/FileExplorer.js` | 117 | `.setAppId(AFN_VARS['google_client_id'])` |
| `Controller/FileExplorer.js` | 118 | `.setDeveloperKey(AFN_VARS['google_picker_api_key'])` |
| `Nodel/MimeType.js` | 12 | `base_url: AFN_VARS["api_uri"]` |
| `Nodel/Extension.js` | 12 | `base_url: AFN_VARS["api_uri"]` |
| `Nodel/Stat.js` | 15 | `AFN_VARS["afn_api_uri"] + "/stats"` |
| `Nodel/Syntax.js` | 12 | `base_url: AFN_VARS["api_uri"]` |
| `Nodel/AppSetting.js` | 5 | `$.get(AFN_VARS["afn_api_uri"]+'/settings?...')` |
| `Nodel/CloudFile.js` | 163 | `AFN_VARS["collab_uri"] + "/api/collaboration/..."` |
| `Nodel/CloudFile.js` | 180 | `AFN_VARS["collab_uri"] + "/api/collaboration/..."` |
| `_upgrade.html` | 43 | `data-key="{{ global_context.window.AFN_VARS.stripe_key }}"` |

**Total raw reads:** 12 across 10 files.

---

## 2. `window` usage (global namespace coupling)

The app pollutes and depends on `window` extensively beyond `AFN_VARS`.

### Global object registration (`Model.js:157-162` via `eval`)

```js
"window."+name+" = function "+name+"(args){",
"window."+name+".super_class = "+first_inherit+";",
"if(!window.classes) window.classes = {};",
"window.classes[window."+name+"] = '"+name+"';",
```

Creates leaked constructor names like `window.FlashController`, `window.EditorController`, etc.

### Router model leak (`Router/Editor.js:40`)

```js
window[model] = self.controller.models[model]
```

Leaks each model constructor onto window.

### Popup context (`Popup.js:12`)

```js
self.global_context.window = window;
```

### Other window references

| File | Line | Usage |
|------|------|-------|
| `Router/Editor.js` | 9 | `$(window).bind('hashchange', ...)` |
| `Router/Editor.js` | 178, 183 | `window.history.pushState(...)` |
| `Controller/Editor.js` | 63 | `window.inactivityRestartInterval` |
| `Controller/Editor.js` | 83 | `$(window).width()` |
| `Controller/Editor.js` | 86 | `$(window).resize(...)` |
| `Controller/Editor.js` | 96 | `$(window).bind('beforeunload', ...)` |
| `Controller/Editor.js` | 103 | `$(window).on('keyup.ctrl-keys keydown.ctrl-keys', ...)` |
| `Controller/Editor.js` | 484-501 | `$(window).off/on('keydown.save', ...)` |
| `Controller/Editor.js` | 403-408 | `window.navigator.msSaveOrOpenBlob`, `window.URL.createObjectURL` |
| `Controller/Editor.js` | 454 | `window.syntaxes` |
| `Controller/Editor.js` | 742-747 | Browser detection via `window.opera`, `window.HTMLElement`, `window.chrome` |
| `Widget/SelectTheme.js` | 11 | `window.matchMedia` |

**Total non-trivial window references:** ~20 across 4 key files.

---

## 3. Cookies

### Helper functions (`helpers.js:4-17`)

```js
function getCookie(name) { ... }
function setCookie(cname, cvalue, exdays) { ... }
```

### Cookie usage map

| Cookie name | Set in | Read in | Purpose |
|-------------|--------|---------|---------|
| `access_token` | `OAuth.js:31,80` | `OAuth.js:28` | Google OAuth access token |
| `dropbox_access_token` | `OAuth.js:191` | `OAuth.js:172` | Dropbox OAuth token |
| `started-date` | `Editor.js:182` | `Editor.js:175` | First-use tracking |
| `asked-review-date` | `Editor.js:200` | `Editor.js:185` | Review prompt tracking |
| `last_hash_url` | `Router/Editor.js:21` | `Router/Editor.js:117` | Last editor route |
| `locale` | `Editor.js:757` | `Locale.js:18` | User locale |
| `AFNVersion` | `Application.js:83` | `analytics.tt:7`, `Application.js:3` | Dev mode toggle |
| `current_google_user_id` | `Nodel/User.js:59` | — | Google user identity |
| `propose-upgrade-count` | `Application.js:125,134` | `Application.js:116` | Upgrade prompt throttle |

**Total cookie keys:** 9. **Total set/read operations:** ~18.

---

## 4. `sessionStorage`

| Key | Read in | Write in | Purpose |
|-----|---------|----------|---------|
| `access_token` | `OAuth.js:27,34,81,117` | `OAuth.js:28,81` | Google OAuth token (primary store) |
| `google_auth_return_to` | `Router/Editor.js:121` | `OAuth.js:49` | Post-auth redirect URL |
| `hasAuthedOnce` | `OAuth.js:57` | `OAuth.js:83` | First-auth tracking |
| `current_user_id` | `Nodel/User.js:38` | `Nodel/User.js:30` | Cached user ID |

**Total sessionStorage keys:** 4 across 2 files.

---

## 5. `localStorage`

| Namespace | File | Purpose |
|-----------|------|---------|
| `Cache` (generic) | `Nodel/Cache.js` | General-purpose cache backed by localStorage |
| `preferences` | `Model/Preferences.js:18` | Preferences cache namespace |

**Cache.js usage:**
- `Cache.js:18` — `localStorage.getItem(this.namespace)`
- `Cache.js:33` — `localStorage.setItem(this.namespace, JSON.stringify(this.data))`
- `Cache.js:26,37` — Error handling with Popup if localStorage unavailable

---

## 6. Inline `onclick`

Found in Handlebars templates. These bypass EventBinder and couple UI directly to global `application` object.

| File | Line | Action |
|------|------|--------|
| `_about.html` | 5 | `application.stop_dev_mode()` |
| `_about.html` | 10 | `application.try_dev_mode()` |
| `_flash.html` | 2 | `application.controllers.editor.flash.toggle_maximize()` |
| `_flash.html` | 3 | `application.controllers.editor.flash.toggle_maximize()` |
| `_major_notice_modal.html` | 17 | `newGoogleAuthBetaTry()` |
| `_unknown_encoding.html` | 22 | `application.controllers.editor.preferences_controller.handle_add_known_ext(this)` |
| `_upgrade.html` | — | Implicit via data-key binding |
| `user.tt` | 11 | `application.controllers.google_oauth.switch_user()` |
| `menu-parts/options/advanced/_select_language.html` | 7, 9 | `application.controllers.editor.select_locale(...)` |
| `editor-menu.tt` | 3 | `application.controllers.editor.top_menu.toggle_mobile_menu()` |
| `Application.js` | 56, 65 | Dynamic string with inline onclick injected via flash |
| `app-main.js.tt` | 103 | Dynamic string with inline onclick for upgrade |

**Total inline onclick sites:** ~12 across 6+ template files and 2 JS files.

---

## 7. `data-eb-click`

EventBinder-based action dispatch. Attribute value is `eval`'d.

### Definition (`EventBinder.js:2-6`)

```js
$(document).on('click', "[data-eb-click]", function(e){
    var $target = $(e.target).closest("[data-eb-click]");
    var action = $target.attr('data-eb-click');
    eval(action);
});
```

### Usage

| File | Action | Purpose |
|------|--------|---------|
| `editor-menu.tt:43` | `application.controllers.editor.deactivate_autosave()` | Toggle autosave off |
| `editor-menu.tt:44` | `application.controllers.editor.activate_autosave(true)` | Toggle autosave on |
| `HBRenderer.js:33` | Wraps menu actions via helper | Renders `data-eb-click` for menu items |

The `HBRenderer.js:33` helper generates `data-eb-click` for many menu items:
```js
return 'data-eb-click="application.controllers.editor.top_menu.action_and_close(function(){'+action+'})"'
```

This means **many menu actions dispatch through eval**.

---

## 8. `eval`

Direct `eval()` calls found in source code:

| File | Line | Expression |
|------|------|------------|
| `Model.js` | 120 | `eval("object = new "+self.model_name+"(object)")` — dynamic constructor |
| `Model.js` | 136 | `eval("object = new "+self.model_name+"(object)")` — dynamic constructor |
| `Model.js` | 165 | `eval(creator)` — class creation from string |
| `Controller/Menu.js` | 107 | `eval(content.attr('data-show-callback'))` — dynamic show callback |
| `EventBinder.js` | 6 | `eval(action)` — event dispatch from `data-eb-click` attribute |

**Total eval calls:** 5 across 3 files. Each represents a dynamic code execution path.

---

## 9. Summary stats

| Coupling type | Unique files involved | Total occurrences |
|---------------|----------------------|-------------------|
| `AFN_VARS` reads | 10 | 12 |
| `window` usage (non-trivial) | 4+ | ~20 |
| Cookie keys | System-wide | 9 keys, ~18 ops |
| `sessionStorage` | 2 | 4 keys |
| `localStorage` | 2 | 2 namespaces |
| Inline `onclick` | 8+ template/JS files | ~12 |
| `data-eb-click` / `eval` | 3 | 3 attribute uses + 5 eval calls |

---

## 10. Areas of highest coupling density

1. **`EditorController` (761 lines)** — combines editor lifecycle, autosave, collaboration, cookie mgmt, browser detection, keybindings, locale
2. **`OAuth.js` (247 lines)** — combines Google + Dropbox auth, token management, sessionStorage, cookies, gapi.execute wrapper
3. **`helpers.js` (237 lines)** — hodgepodge of globals, cookies, utility functions, no module boundary
4. **Inline `onclick` + `data-eb-click` cascade** — templates directly reference `application.controllers.*`, making controller renaming/refactoring dangerous
5. **`Model.js` eval class system** — every class depends on dynamic eval-based inheritance; cannot tree-shake or statically analyze

---

## 11. Recommendations

1. **Config wrapper** — one access point for all `AFN_VARS` keys (see `seam-design.md`)
2. **Cookie/sessionStorage wrapper** — one module for all persistence operations
3. **Event action registry** — replace `data-eb-click` + `eval` with registered action map
4. **Inline onclick audit** — move to EventBinder or explicit event handlers
5. **`window` namespace audit** — register controllers/models explicitly, not via `eval` and implicit window assignment
