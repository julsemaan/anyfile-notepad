# Client dependency baseline

Updated for browser migration source `6ccf2a0fe075cf41714832c66dcc2ecb4b8258d9` on `chore/frontend-get-well-contd-oct12`. This is a source inventory, not an inventory of the deployed image. Release and browser gates remain open.

## Evidence boundary

The committed client has these dependency inputs:

- `package.json` declares five npm runtime dependencies and three npm dev dependencies.
- `package-lock.json` is lockfile version 3 with 246 package entries including the root. `client/Dockerfile` copies both manifests and runs `npm ci`.
- `bower.json` retains only the pinned Ace fork. There is no Bower lockfile.
- `client/Dockerfile` starts from `ghcr.io/julsemaan/anyfile-notepad/client-base:f37e641c284f0f24d431da390d039a9a6af26527`. That separately published base image is built from `client/base/Dockerfile`, so the source recipe is not the direct base input to the full image.
- `client/base/Dockerfile` uses the pinned `node:24.20.0-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2` image, installs npm `11.19.0` globally, and installs apt inputs including `git` plus CPAN inputs. The exact installed apt and CPAN versions are not recorded here.
- Local npm dependencies were installed for checks. The baseline inspects source wiring without reading secret-bearing `VARS.js` or generated output. Installed images and Ace were not inspected in this batch.

The expected image flow is `client-full:<workflow tag>` followed by `client-light:<workflow tag>`. The workflow tag is derived from the GitHub commit SHA. The deployment repository and the currently deployed tag or digest are outside this repository, so no deployed image or rollback image is identified by this baseline.

## npm dependencies

These are the direct entries in `client/package.json`. The resolution is the value in the committed lockfile, not a claim about the installed image.

| Package | Declaration | Lock resolution | Role |
|---|---|---:|---|
| `dropbox` | `<3.0.0` | 2.5.13 | Runtime: `Dropbox-sdk.min.js` is appended to `application.js` |
| `handlebars` | `4.7.10` | 4.7.10 | Full browser distribution appended to the application bundle; escaping and prototype checks retained |
| `jquery` | `3.7.1` | 3.7.1 | Full minified npm distribution, including AJAX and effects, loaded before Bootstrap |
| `bootstrap` | `3.4.1` | 3.4.1 | npm JS/CSS and fonts; unsupported temporary containment |
| `marked` | `18.1.1` | 18.1.1 | npm `lib/marked.umd.js` copied after public assets to `/marked.js` |

| Package | Declaration | Lock resolution | Role |
|---|---|---:|---|
| `bower` | `1.8.14` | 1.8.14 | Build only: runs `bower install` for the Bower tree |
| `sass` | `1.104.0` | 1.104.0 | Build only: compiles `editor.css.scss` and `pages.css.scss` with `sass --no-source-map --load-path` |
| `minify` | `15.3.1` | 15.3.1 | Build only: minifies the application CSS and JS with `minify --fail-on-error` per `client/.minify.json` |

The lockfile root `packages[""]` records the same two sets above. For the exact version, integrity, and nested package data, use the committed [`package-lock.json`](package-lock.json).

Clean `npm ci` passed under Node 24.20.0 and npm 11.19.0 without lockfile changes. Handlebars requires the accompanying `minimist` update to 1.2.8. `source-map-js` resolves to 1.2.2 through existing ranges, with no direct declaration or override. Unrelated retained resolutions are unchanged.

Fresh `npm audit --json` and `npm audit --omit=dev --json` both exited 1 with 16 findings: 1 low, 3 moderate, 10 high, 2 critical. Neither flags Handlebars or source-map-js. Bootstrap retains [GHSA-vxmc-5x29-h64v](https://github.com/advisories/GHSA-vxmc-5x29-h64v) and [GHSA-q58r-hwc8-rm9j](https://github.com/advisories/GHSA-q58r-hwc8-rm9j). Remaining flagged packages are `cookiejar`, `debug`, `degenerator`, `dropbox`, `form-data`, `ip`, `netmask`, `pac-proxy-agent`, `pac-resolver`, `proxy-agent`, `qs`, `socks`, `socks-proxy-agent`, `superagent-proxy`, and `word-wrap`. Critical findings affect `form-data` and `netmask` in the retained Dropbox tree. These are package-tree findings, not browser exploitability assessments. Bower, vendored assets, images, and external scripts are outside this scan. This batch is not full recovery.

## Other build inputs

| Input | Source | Use |
|---|---|---|
| Node/npm | `client/base/Dockerfile`: pinned `node:24.20.0-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2` plus global npm `11.19.0` | npm install, the client build, and the nested Ace build |
| apt tools | `perl`, `gcc`, `curl`, `git`, `make`, `inotify-tools` | Template rendering, native npm builds, Bower git sources, resource downloads, and webdev watching |
| CPAN modules | `Template`, `Getopt::Long`, `JSON`, `File::Slurp`, `Tie::IxHash` | `render.pl` and page generation |
| Shell utilities | Bash, `find`, `grep`, `cp`, `rm`, `mkdir`, `realpath`, `sha1sum`, `awk`, `date`, `truncate` | `afn-app.sh` build pipeline |
| Minify config | `client/.minify.json`: css type `clean-css`, js type `terser` | Selected by both `minify --fail-on-error` invocations |

Versions and digests for the apt and CPAN inputs are not available from the committed source; the Node image digest above is the full pinned input from `client/base/Dockerfile`.

## Bower dependencies

Bower components are downloaded by `./node_modules/.bin/bower install`. The build copies selected files from them, but the resolved checkout is not committed or present locally.

| Package | Declaration | Build and browser exposure | Source/version evidence |
|---|---|---|---|
| `ace-anyfile-notepad` | `https://github.com/julsemaan/ace.git#29c744e292c7fd20c8283ed528b9c12b6174a83d` | `afn-app.sh` runs a second `npm install` and `make afn-dist` inside the component, then copies `afn-dist/*` to `/ace.js/`. | Pinned git SHA; needs `git` in the build image. The resolved nested package tree is unavailable. |

Bootstrap and jQuery now come from npm. Source inspection found no jQuery UI widgets/effects or indirect plugin consumers; the file-tree and application animations use core jQuery. Cookie had no callers, and the tour had only an unused initialization, with no call to `menu_change_tour`. Their inputs and the tour controller were removed with Shepherd/Tether. Native cookie helpers remain. Removal is provisional until beta startup, cookies, menus, file-tree expansion, and animations pass. Restore any affected dependency if a runtime consumer appears.

## Vendored browser code and assets

Every `assets/js/*.js` file is appended by the broad `find` in `application_js()`, except the files listed separately for ordering. The following files are therefore browser inputs even when their application call sites are small or unclear.

Handlebars is not vendored. It comes from npm `4.7.10` and is appended from `node_modules/handlebars/dist/handlebars.js`. The rendering check is `tests/handlebars.js` and needs `node_modules` present.

| Code | Version or source recorded in the file | Use and exposure |
|---|---|---|
| `assets/js/libs/rsvp.min.js` | RSVP 3.1.0 | Promises used by models and routing. App and site bundles. |
| `assets/js/libs/route-recognizer.js` | Route Recognizer 0.1.9 | Hash route matching, through the local router. App and site bundles. |
| `assets/js/libs/router.min.js` | Version not recorded; uses the local Route Recognizer and RSVP | Hash routing. App and site bundles. |
| `assets/js/libs/l10n.js` | Version not recorded; file credits `purl.eligrey.com/github/l10n.js` | Installs `String.toLocaleString`, `String.prototype.toLocaleString`, and `String.locale`; used by LocaleController `addLocale`, `findLocale`, and `i18n` plus ApplicationController `setupLocaleFlash`. |
| `assets/js/libs/material.min.js` and `ripples.min.js` | Version not recorded; the site credits Bootstrap Material Design | Material controls and ripple effects. App and site bundles. |
| `assets/js/libs/rcolor.min.js` | Version and source not recorded | Generates collaborator colors from `helpers.js`. App and site bundles. |
| `assets/js/libs/jquery.fix.clone.js` | Local jQuery `clone()` patch; no package version | Extends jQuery and is loaded by the broad bundle. |
| `public/jqueryFileTree/jqueryFileTree.js` and `.css` | JavaScript file says version 1.01; source credits A Beautiful Site | File explorer UI and styles. App and site bundles. |
| `assets/css/libs/bundled-material.min.css.scss` | Version and source commit not recorded; includes Material Design Icons and Bootstrap Material rules | Imported into application and page CSS through `@use`. |
| `public/fonts/*` | Lato and Material Design Icons remain vendored; old Glyphicons are overwritten | npm Bootstrap 3.4.1 fonts copy after public assets, including `.woff2`, at the existing `/fonts/` URLs. |
| `public/sw.js` | Source contains one remote `importScripts` call; no local version | Copied to browser output. No service-worker registration call was found in the client source, so runtime reachability is unverified. |

The build also copies the committed images under `public/`, including provider icons and the file-tree images. They are shipped assets, not package-manager dependencies.

## Browser bundle assembly

`client/afn-app.sh` builds these browser-facing outputs:

- `application.js` contains the Dropbox SDK, npm full jQuery 3.7.1, Bootstrap 3.4.1, file-tree code, Handlebars 4.7.10, and all remaining `assets/js/*.js` files. Migrate is not included.
- `application.css` contains Bootstrap, file-tree CSS, and editor CSS compiled by `sass --no-source-map --load-path`. `pages.css` contains Bootstrap and the shared material/page styles compiled the same way. `assets/css/common.css.scss` is deleted; its rules now live in `pages.css.scss`. Both SCSS entries use `@use`, not `@import`.
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
| `//www.googletagservices.com/tag/js/gpt.js` | Included by the shared app layout; ad setup is in that layout | `editor-layout.tt`, `_propose_upgrade.html` |
| `https://storage.googleapis.com/dbmtiqbxqoopp7t3s9lq/sdbmtiqbxqoopp7t3s9lq.js` and `vdbmtiqbxqoopp7t3s9lq.js` | Shared app layout and the upgrade prompt template | `editor-layout.tt`, `_propose_upgrade.html` |
| `https://apis.google.com/js/client.js?onload=gapi_loaded` | App load for Google OAuth, Drive, and Picker APIs | `editor-layout.tt` |
| `https://accounts.google.com/gsi/client` | App load for Google Identity Services | `editor-layout.tt` |
| `https://otelev.com/22/17133d254dc58db1395ab65191071264` | Ads-enabled app template | `app.tt` |
| `//resources.infolinks.com/js/infolinks_main.js` | Ads-enabled app template | `app.tt` |
| `https://checkout.stripe.com/checkout.js` | Upgrade template when the subscription UI is rendered | `_upgrade.html` |
| `https://pages.anyfile-notepad.semaan.ca/<page>.markdown` | Site page Markdown request. Webdev changes this to `http://localhost:8000/pages`. | `site/site-content.tt` |
| `https://luckypushh.com/ntfc.php?p=1621486&r=sw` | `importScripts` when the shipped service worker is executed | `public/sw.js` |

The print window loads no remote script. Its wiring is covered by `tests/print-source-check.js`, which runs with plain node.

The app also makes runtime requests to configured `AFN_VARS` destinations for the REST API, billing, statistics, settings, and collaboration, and to Google Drive and Dropbox through their browser APIs. The checked-in source does not contain the values from `VARS.js`. Navigation-only links to Google accounts, the Chrome store, support, administration, and documentation are not counted as script or data loads here.

## Validation and release gates

The 118-assertion source baseline and all eight Node checks pass under the pinned toolchain. Markdown checks exercise all 12 committed pages, including trusted raw HTML. `MDRenderer` consumes only first-party pages; Marked is not an HTML sanitizer and must not render untrusted Markdown here.

An isolated asset smoke build passed concatenation, Sass, JS/CSS minification, JS syntax, exact npm font/Marked copies, and absence of removed libraries. This exercised asset functions, not the full build or image. Docker has no daemon, local Perl lacks `Template`, and Ace is absent. Full/light GHA builds, both generated app variants, Ace output, beta deployment, and browser evidence remain unverified. The reviewed source is `6ccf2a0`; final documentation commits must also be included in the release SHA.


Not available in this source-only baseline:

- the deployed `client-full` or `client-light` image digest, its actual Node/npm versions, installed npm tree, Bower resolutions, or nested Ace commit and build tree;
- a retrievable known-good rollback image;
- an approved browser runner and a browser run against the unchanged application;
- disposable test accounts and files;
- screenshots at desktop and mobile viewports, console logs, or network captures.

The lightweight check in [`tests/check_baseline.py`](tests/check_baseline.py) verifies source wiring and manifest consistency without installing packages, running Docker, starting a browser, reading secrets, or changing output. It does not satisfy the runtime smoke gates above.
