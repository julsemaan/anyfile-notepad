# Client dependency baseline

Captured on 2026-09-08 from source commit `e5655cca4dceb5428bd4aeab8de34a666575f582` on `chore/client-dependency-baseline`.

This is a source inventory. It is not an inventory of the deployed image. No application dependency was upgraded in this change.

## Evidence boundary

The committed client has these dependency inputs:

- `package.json` declares three npm runtime dependencies and three npm dev dependencies.
- `package-lock.json` is lockfile version 3 with 245 entries in `packages`, including the root `packages[""]` entry. It is the complete committed npm name and version list. The Dockerfile does not copy it before running `npm install`, so the installed image is not proven to match it.
- `bower.json` declares four Bower dependencies. There is no committed Bower lockfile.
- `client/base/Dockerfile` uses the pinned `node:24.20.0-bookworm` image, installs npm `11.19.0` globally, and installs apt inputs including `git` plus CPAN inputs. The exact installed apt and CPAN versions are not recorded here.
- `node_modules/`, `bower_components/`, `output/`, and `assets/js/VARS.js` are absent from this checkout and are ignored by git. The static check therefore inspects source wiring only.

The expected image flow is `client-full:<workflow tag>` followed by `client-light:<workflow tag>`. The workflow tag is derived from the GitHub commit SHA. The deployment repository and the currently deployed tag or digest are outside this repository, so no deployed image or rollback image is identified by this baseline.

## npm dependencies

These are the direct entries in `client/package.json`. The resolution is the value in the committed lockfile, not a claim about the installed image.

| Package | Declaration | Lock resolution | Role |
|---|---|---:|---|
| `dropbox` | `<3.0.0` | 2.5.13 | Runtime: `Dropbox-sdk.min.js` is appended to `application.js` |
| `handlebars` | `4.7.9` | 4.7.9 | Runtime: `node_modules/handlebars/dist/handlebars.js` is appended to `application.js`; rendering check is `tests/handlebars.js` |
| `tether-shepherd` | `^1.8.1` | 1.8.1 | Runtime: Shepherd and Tether CSS/JS are appended to `application.js` and CSS |

| Package | Declaration | Lock resolution | Role |
|---|---|---:|---|
| `bower` | `1.8.14` | 1.8.14 | Build only: runs `bower install` for the Bower tree |
| `sass` | `1.104.0` | 1.104.0 | Build only: compiles `editor.css.scss` and `pages.css.scss` with `sass --no-source-map --load-path` |
| `minify` | `15.3.1` | 15.3.1 | Build only: minifies the application CSS and JS with `minify --fail-on-error` per `client/.minify.json` |

The lockfile root `packages[""]` records the same two sets above. For the exact version, integrity, and nested package data, use the committed [`package-lock.json`](package-lock.json).

The dated audit was run against a temporary copy of the two npm manifests with `npm audit --package-lock-only --ignore-scripts` using npm 11.12.1. It returned exit status 1 with 42 package findings: 7 critical, 27 high, 6 moderate, and 2 low. This is package-manager evidence, not a browser exploitability assessment. It does not cover Bower, vendored files, the nested Ace tree, or remote scripts. It predates the `sass`/`minify`/`bower` devDependency split recorded here.

## Other build inputs

| Input | Source | Use |
|---|---|---|
| Node/npm | `client/base/Dockerfile`: pinned `node:24.20.0-bookworm` plus global npm `11.19.0` | npm install, the client build, and the nested Ace build |
| apt tools | `perl`, `gcc`, `curl`, `git`, `make`, `inotify-tools` | Template rendering, native npm builds, Bower git sources, resource downloads, and webdev watching |
| CPAN modules | `Template`, `Getopt::Long`, `JSON`, `File::Slurp`, `Tie::IxHash` | `render.pl` and page generation |
| Shell utilities | Bash, `find`, `grep`, `cp`, `rm`, `mkdir`, `realpath`, `sha1sum`, `awk`, `date`, `truncate` | `afn-app.sh` build pipeline |
| Minify config | `client/.minify.json`: css type `clean-css`, js type `terser` | Selected by both `minify --fail-on-error` invocations |

Versions and digests for the apt and CPAN inputs are not available from the committed source.

## Bower dependencies

Bower components are downloaded by `./node_modules/.bin/bower install`. The build copies selected files from them, but the resolved checkout is not committed or present locally.

| Package | Declaration | Build and browser exposure | Source/version evidence |
|---|---|---|---|
| `ace-anyfile-notepad` | `https://github.com/julsemaan/ace.git#29c744e292c7fd20c8283ed528b9c12b6174a83d` | `afn-app.sh` runs a second `npm install` and `make afn-dist` inside the component, then copies `afn-dist/*` to `/ace.js/`. | Pinned git SHA; needs `git` in the build image. The resolved nested package tree is unavailable. |
| `bootstrap` | `3.1.1` | Its CSS and JS are appended to the application bundle. Its CSS is also the input for `pages.css`. | Bower declaration only; source registry metadata and installed checkout are unavailable. |
| `jquery` | `~1.11` | Its minified browser file is appended before jQuery UI and Bootstrap. Many client helpers and controllers use jQuery. | Range declaration only; the resolved patch version is unavailable. |
| `jquery-ui` | `~1.11` | Its minified browser file is appended after jQuery. No jQuery UI stylesheet is appended by `afn-app.sh`. | Range declaration only; the resolved patch version is unavailable. No obvious widget call was found in source, but that is not proof it is unused. |

## Vendored browser code and assets

Every `assets/js/*.js` file is appended by the broad `find` in `application_js()`, except the files listed separately for ordering. The following files are therefore browser inputs even when their application call sites are small or unclear.

Handlebars is not vendored. It comes from npm `4.7.9` and is appended from `node_modules/handlebars/dist/handlebars.js`. The rendering check is `tests/handlebars.js` and needs `node_modules` present.

| Code | Version or source recorded in the file | Use and exposure |
|---|---|---|
| `assets/js/libs/rsvp.min.js` | RSVP 3.1.0 | Promises used by models and the Shepherd tour. App and site bundles. |
| `assets/js/libs/route-recognizer.js` | Route Recognizer 0.1.9 | Hash route matching, through the local router. App and site bundles. |
| `assets/js/libs/router.min.js` | Version not recorded; uses the local Route Recognizer and RSVP | Hash routing. App and site bundles. |
| `assets/js/libs/l10n.js` | Version not recorded; file credits `purl.eligrey.com/github/l10n.js` | Installs `String.toLocaleString`, `String.prototype.toLocaleString`, and `String.locale`; used by LocaleController `addLocale`, `findLocale`, and `i18n` plus ApplicationController `setupLocaleFlash`. |
| `assets/js/libs/material.min.js` and `ripples.min.js` | Version not recorded; the site credits Bootstrap Material Design | Material controls and ripple effects. App and site bundles. |
| `assets/js/libs/rcolor.min.js` | Version and source not recorded | Generates collaborator colors from `helpers.js`. App and site bundles. |
| `assets/js/libs/jquery.fix.clone.js` | Local jQuery `clone()` patch; no package version | Extends jQuery and is loaded by the broad bundle. |
| `public/jquery.cookie.min.js` | jQuery Cookie 1.4.0 | App bundle input. No direct `$.cookie` call was found; the application has its own cookie helpers. Runtime confirmation is missing. |
| `public/jqueryFileTree/jqueryFileTree.js` and `.css` | JavaScript file says version 1.01; source credits A Beautiful Site | File explorer UI and styles. App and site bundles. |
| `public/marked.js` | Version not recorded; source link is `https://github.com/chjj/marked` | Loaded separately by site pages and used by `MDRenderer`. |
| `assets/css/libs/bundled-material.min.css.scss` | Version and source commit not recorded; includes Material Design Icons and Bootstrap Material rules | Imported into application and page CSS through `@use`. |
| `public/fonts/*` | Lato, Material Design Icons, and Bootstrap Glyphicons; individual releases are not recorded | Copied to the browser output and referenced by the CSS. |
| `public/sw.js` | Source contains one remote `importScripts` call; no local version | Copied to browser output. No service-worker registration call was found in the client source, so runtime reachability is unverified. |

The build also copies the committed images under `public/`, including provider icons and the file-tree images. They are shipped assets, not package-manager dependencies.

## Browser bundle assembly

`client/afn-app.sh` builds these browser-facing outputs:

- `application.js` contains the Dropbox SDK, Bower jQuery, jQuery UI, Bootstrap, Shepherd/Tether, file-tree code, cookie code, npm Handlebars 4.7.9, and all `assets/js/*.js` files.
- `application.css` contains Bootstrap, Shepherd, file-tree CSS, and editor CSS compiled by `sass --no-source-map --load-path`. `pages.css` contains Bootstrap and the shared material/page styles compiled the same way. `assets/css/common.css.scss` is deleted; its rules now live in `pages.css.scss`. Both SCSS entries use `@use`, not `@import`.
- Non-webdev builds minify the application CSS and JS with `minify --fail-on-error` using `client/.minify.json` (css `clean-css`, js `terser`).
- `render.pl` creates both `app.html` with `WITH_ADS => 1` and `app-plus-plus.html` with `WITH_ADS => 0` from the same template. Webserver subscription/session logic chooses between them; this baseline does not test that choice.
- The Ace distribution is copied separately under `ace.js/`, including `ace.js` and `ext-language_tools.js` at minimum.
- Site pages load the unminified application bundle and `marked.js`, then fetch their Markdown content at runtime.

## External loads and destinations

The source contains these external loads. Remote scripts have no committed version, integrity hash, or browser evidence in this baseline.

| Destination | Trigger | Source |
|---|---|---|
| `https://api.anyfile-notepad.semaan.ca/extensions`, `/syntaxes`, `/mime_types` | Build downloads JSON resources, unless a webdev cache is reused | `afn-app.sh` |
| `//fonts.googleapis.com/icon?family=Material+Icons` | App document load in both rendered variants | `editor-layout.tt` |
| `//www.google-analytics.com/analytics.js` | App and site document load | `analytics.tt` |
| `//www.googletagservices.com/tag/js/gpt.js` | Included by the shared app layout; ad setup is in that layout | `editor-layout.tt` |
| `https://storage.googleapis.com/dbmtiqbxqoopp7t3s9lq/sdbmtiqbxqoopp7t3s9lq.js` and `vdbmtiqbxqoopp7t3s9lq.js` | Shared app layout and the upgrade prompt template | `editor-layout.tt`, `_propose_upgrade.html` |
| `https://apis.google.com/js/client.js?onload=gapi_loaded` | App load for Google OAuth, Drive, and Picker APIs | `editor-layout.tt` |
| `https://accounts.google.com/gsi/client` | App load for Google Identity Services | `editor-layout.tt` |
| `https://parchmentuniquevista.com/17133d254dc58db1395ab65191071264/invoke.js` | Ads-enabled app template | `app.tt` |
| `//resources.infolinks.com/js/infolinks_main.js` | Ads-enabled app template | `app.tt` |
| `https://checkout.stripe.com/checkout.js` | Upgrade template when the subscription UI is rendered | `_upgrade.html` |
| `https://pages.anyfile-notepad.semaan.ca/<page>.markdown` | Site page Markdown request. Webdev changes this to `http://localhost:8000/pages`. | `site/site-content.tt` |
| `https://luckypushh.com/ntfc.php?p=1621486&r=sw` | `importScripts` when the shipped service worker is executed | `public/sw.js` |

The print window loads no remote script. Its wiring is covered by `tests/print-source-check.js`, which runs with plain node.

The app also makes runtime requests to configured `AFN_VARS` destinations for the REST API, billing, statistics, settings, and collaboration, and to Google Drive and Dropbox through their browser APIs. The checked-in source does not contain the values from `VARS.js`. Navigation-only links to Google accounts, the Chrome store, support, administration, and documentation are not counted as script or data loads here.

## Gaps and release gates

Not available in this source-only baseline:

- the deployed `client-full` or `client-light` image digest, its actual Node/npm versions, installed npm tree, Bower resolutions, or nested Ace commit and build tree;
- a retrievable known-good rollback image;
- an approved browser runner and a browser run against the unchanged application;
- disposable test accounts and files;
- screenshots at desktop and mobile viewports, console logs, or network captures.

The lightweight check in [`tests/check_baseline.py`](tests/check_baseline.py) verifies source wiring and manifest consistency without installing packages, running Docker, starting a browser, reading secrets, or changing output. It does not satisfy the runtime smoke gates above.
