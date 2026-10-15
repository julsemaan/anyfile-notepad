# Client dependency checks

## Run checks

From the repository root, using Node 24.20.0 and npm 11.19.0:

```sh
cd client && npm ci && cd ..
python3 client/tests/check_baseline.py
for check in client/tests/*.js; do
  node "$check" || exit
done
```

The baseline uses Python's standard library. It checks manifest sets, lockfile version 3, all 246 package entries through a fixed SHA-256 digest, selected resolutions, bundle paths/order, removal of obsolete inputs, npm font copy ordering, `/marked.js`, both app template variants, CSS anchors, and external script URLs. It does not install dependencies, build images, read `VARS.js`, or verify Docker/toolchain pins or Ace's nested tree.

## Node checks

| Check | Coverage |
|---|---|
| `handlebars.js` | npm 4.7.10 browser distribution; templates, escaping, and denied prototype access |
| `jquery-compat.js` | Flash counts with `.length`; collaboration `.done()` polling, event delivery, own-event filtering, cursor progression, retries and disabled polling |
| `markdown.js` | npm Marked 18.1.1 UMD; inline formatting, links, lists, code, exact panel delimiters, trusted raw HTML, balanced columns, all 12 committed pages |
| `ad-testing.js` | Native ad-testing cookie enable/disable and application startup without the removed tour |
| `dev-reload.js` | Successful-build reload marker and unsaved-edit prompt behavior |
| `editor-unload.js` | Editor unload behavior |
| `print-source-check.js` | Native print-window handling without jQuery |
| `realtime-departure.js` | Lifecycle-safe departures and ordinary event publish retries |

Handlebars, jQuery compatibility, and Markdown checks require npm dependencies. These are small Node checks with mocks, not a browser framework. The Markdown DOM stub does not execute trusted page scripts or model browser HTML parsing. `MDRenderer` is for trusted first-party pages only. Marked does not sanitize HTML.

## Current results

Source `6ccf2a0fe075cf41714832c66dcc2ecb4b8258d9`, Node 24.20.0/npm 11.19.0:

- Clean `npm ci`, 118 baseline assertions, and all eight Node checks passed. The lockfile remained unchanged.
- Isolated asset build passed Sass, concatenation, JS/CSS minification, minified JS syntax, exact npm Bootstrap fonts and Marked copies, and removed-library checks. It was not a full app/image build.
- Full and production-only audits both exited 1 with 16 findings: 1 low, 3 moderate, 10 high, 2 critical. Handlebars and source-map-js are no longer flagged. See `../DEPENDENCIES.md` for retained findings.
- Supplied-diff agent review found no important code issues. It did not independently execute tests or inspect images.

## Open browser and release gates

The sandbox has no usable browser or Docker daemon. Local Perl lacks `Template`, and Ace is absent. No full/light images or beta release were verified for this source.

Before release, record the final source SHA, full/light GHA image tags and immutable digests, and a retrievable known-good rollback image. Verify both app variants, generated JS/CSS, `/marked.js`, fonts and Ace output. Check that no removed libraries or obsolete duplicate copies ship.

Use disposable accounts/files and isolated browser profiles at desktop and mobile sizes, such as 1280x800 and 390x844. Capture sanitized screenshots, console errors and failed requests without tokens, session IDs or private content.

All scenarios below remain open for this batch:

- Paid/ad-free behavior with `AFNForceAds` disabled, and the ads-enabled variant.
- Google Drive and Dropbox open, edit, save, reload, autosave, and file browsing. Hostile filenames must not execute scripts.
- Startup, native cookies, menus, file-tree expansion and animations without UI/Cookie/tour inputs. Restore the affected dependency if an indirect consumer appears.
- Dialogs, keyboard focus, preferences, cloned textarea/select controls, printing, and desktop/mobile layout.
- Two-browser collaboration with no rebroadcast loops.
- Home, FAQ, contact and payment pages, including panels, links, raw HTML and column layout. Check missing content and duplicated paragraph wrappers.
- Font requests, console errors and failed network requests.

Use uncompressed jQuery Migrate only for diagnosis if needed. It is absent from release inputs, and final behavior must pass without it. Keep removals and the beta release unverified until evidence exists. Historical user-reported beta success does not validate this batch.
