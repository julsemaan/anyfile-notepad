# Q1 Config Contract

> **Purpose:** Document actual runtime config keys used, identify stale/missing keys in example file, establish ownership.
> **File:** `refactoring-docs/q1/config-contract.md`

---

## 1. Config source

All runtime config lives in `window.AFN_VARS`, defined by `client/assets/js/VARS.js`. This file is generated per-environment (dev, staging, production) and must not be committed.

**Example file:** `client/assets/js/VARS.js.example` — template for manual copy, known to be stale.

---

## 2. Actual keys used at runtime

Grep of `client/assets/js/` (non-vendor) reveals these keys:

| Key | Files using it | Purpose |
|-----|----------------|---------|
| `api_uri` | `Nodel/MimeType.js:12`, `Nodel/Extension.js:12`, `Nodel/Syntax.js:12` | Base URL for API resources |
| `afn_api_uri` | `Nodel/AppSetting.js:5`, `Nodel/Stat.js:15` | API URL for settings + stats endpoints |
| `google_client_id` | `Controller/OAuth.js:3`, `Controller/FileExplorer.js:117` | Google OAuth 2.0 client ID, Google Picker app ID |
| `drive_app_id` | `Controller/OAuth.js:4` | Google Drive app ID |
| `google_picker_api_key` | `Controller/FileExplorer.js:118` | Google Picker API developer key |
| `dropbox_key` | `Controller/OAuth.js:169` | Dropbox app key |
| `collab_uri` | `Nodel/CloudFile.js:163,180` | Collaboration API base URL |
| `stripe_key` | `client/_upgrade.html:43` (template) | Stripe publishable key |

---

## 3. Example file vs. runtime mismatch

### `client/assets/js/VARS.js.example`

```js
window.AFN_VARS = {
  api_uri:"",
  google_client_id:"",
  drive_app_id:"",
  dropbox_key:"",
  stripe_key:"",
  collab_uri:"",
};
```

### Present in example but used differently:

| Key | Matches runtime? | Note |
|-----|-----------------|------|
| `api_uri` | ✅ | Same name, same usage across MimeType/Extension/Syntax models |
| `google_client_id` | ✅ | Same name, same usage in OAuth.js + FileExplorer.js |
| `drive_app_id` | ✅ | Same name, same usage in OAuth.js |
| `dropbox_key` | ✅ | Same name, same usage in OAuth.js |
| `stripe_key` | ✅ | Same name, used in template `_upgrade.html:43` |
| `collab_uri` | ✅ | Same name, same usage in CloudFile.js |

### Missing from example:

| Key | Runtime usage | Critical? |
|-----|---------------|-----------|
| `afn_api_uri` | `AppSetting.js:5`, `Stat.js:15` | **Yes** — settings and stats would 404 without this |
| `google_picker_api_key` | `FileExplorer.js:118` | **Yes** — Google Picker won't load |

### Example has no stale keys

All keys in the example are actually used. The gap is the two missing keys.

---

## 4. Where keys enter the app

| Key | Entry point | Mechanism |
|-----|-------------|-----------|
| `api_uri` | `VARS.js` | Direct `AFN_VARS["api_uri"]` read |
| `afn_api_uri` | `VARS.js` | Direct `AFN_VARS["afn_api_uri"]` read |
| `google_client_id` | `VARS.js` | Read in OAuth.js constructor |
| `drive_app_id` | `VARS.js` | Read in OAuth.js constructor |
| `google_picker_api_key` | `VARS.js` | Read in FileExplorer.js |
| `dropbox_key` | `VARS.js` | Read in OAuth.js constructor |
| `collab_uri` | `VARS.js` | Read in CloudFile.js |
| `stripe_key` | Template `_upgrade.html` | `{{ global_context.window.AFN_VARS.stripe_key }}` |

All keys are read ad-hoc from `window.AFN_VARS`. There is no wrapper or config service.

---

## 5. Ownership map

| Key | Owned by | Change risk |
|-----|----------|-------------|
| `api_uri` | API deployment | Low — stable endpoint |
| `afn_api_uri` | API deployment | Low — stable endpoint |
| `google_client_id` | Google Cloud Console + CI secrets | Medium — needs OAuth consent screen update |
| `drive_app_id` | Google Cloud Console | Low — static app identity |
| `google_picker_api_key` | Google Cloud Console + CI secrets | Medium — API key restrictions |
| `dropbox_key` | Dropbox App Console + CI secrets | Medium — needs app config update |
| `collab_uri` | Backend collaboration service | Low — stable endpoint |
| `stripe_key` | Stripe Dashboard + CI secrets | High — affects billing, must match Stripe account |

---

## 6. Recommendations

1. **Add missing keys to `VARS.js.example`:**
   - `afn_api_uri`
   - `google_picker_api_key`

2. **Create a single config access wrapper** (Q2 seam):
   - Stop ad-hoc `AFN_VARS["..."]` reads
   - One function/object that all code uses
   - Validation at boot that all expected keys exist

3. **Document CI secret injection** in workflow files:
   - `client` workflow injects VARS.js from GitHub secrets
   - Add comment showing which secret maps to which key

4. **Audit for derived/derived config:**
   - `Stat.js:15` constructs URL from `afn_api_uri + "/stats"` — consistent
   - `AppSetting.js:5` constructs URL from `afn_api_uri` — consistent
   - No derived config values found
