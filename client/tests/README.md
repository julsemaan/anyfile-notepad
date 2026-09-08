# Client baseline checks

## Source-only check

Run this from the repository root:

```sh
python3 client/tests/check_baseline.py
```

The check uses only the Python standard library. It reads the committed npm and Bower manifests plus `.minify.json`, verifies the lockfile version 3 shape with 245 `packages` entries, its fixed SHA-256 digest, and the pinned `node_modules` resolutions, verifies the split runtime and dev dependency sets against the lock root `packages[""]`, checks the Bower SHA pin, checks the build's browser inputs including npm Handlebars and both `sass` and `minify --fail-on-error` invocations, checks the CSS anchors (`common.css.scss` absent, `@use` with no `@import`, moved flash and footer styles, inlined menu fix), checks both rendered app variants, and checks selected external-load anchors. It no longer expects a vendored Handlebars file or a print-window jQuery load. It does not install packages, access the network, run Docker, start a browser, load `VARS.js`, or write build output.

A passing result means the committed source still describes the recorded baseline. It is not a browser smoke result and does not prove that an image was built or deployed.

## Companion node checks

`client/tests/print-source-check.js` runs with plain node and no install step. It covers the print template and print controller wiring that the Python check anchors.

`client/tests/handlebars.js` needs `node_modules` present because Handlebars now comes from npm 4.7.9 instead of a vendored file. Run it only when `node_modules` exists; otherwise record it as not run.

## Browser baseline status

No browser runner is included. The repository has no existing client test harness, and adding a browser framework or runner needs a separate approved choice. The source-only check is the smallest repeatable check that can run without that approval.

The runtime baseline has not been run because the deployed image, an immutable rollback image, disposable accounts/files, and an approved isolated browser environment are unavailable. These are gaps, not passing results.

| Scenario | Status | Required evidence |
|---|---|---|
| `/app.html` loads the ad-enabled variant for an unpaid session and the ad-free variant for a paid session; menus and editor render | Not run | Deployed image, isolated browser, and unpaid and paid sessions |
| Open, edit, save, and reload exact text, including Unicode and line breaks | Not run | Disposable Google Drive and Dropbox files |
| Autosave and file browsing | Not run | Disposable files and browser network capture |
| Preferences and dialogs, including keyboard focus, confirm, and cancel | Not run | Fixed-viewport browser run and console capture |
| Printing, line numbers, and print preview | Not run | Browser print-window run and manual preview inspection |
| Two-browser collaboration convergence without rebroadcast loops | Not run | Two isolated browser profiles and one disposable collaborative file |
| Home and representative site content/form pages | Not run | Deployed or locally built image plus page-content service |
| Desktop/mobile screenshots and console/network diagnostics | Not run | Fixed viewports, sanitized artifacts, and browser DevTools output |

No runtime failures are claimed. The dependency inventory records source-level limitations separately from test outcomes.

## When browser access is available

Use isolated disposable profiles and fixed viewport sizes such as 1280x800 and 390x844. Do not use real user files or leave tokens, session identifiers, or private file contents in artifacts. Capture the source commit, image tag or digest, request failures, console errors, and sanitized screenshots. Record existing failures separately from regressions.

The rollback image remains **unavailable**. Do not substitute a mutable client-base tag for a known-good client image.
