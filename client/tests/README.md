# Client baseline checks

## Source-only check

Run this from the repository root:

```sh
python3 client/tests/check_baseline.py
```

The check uses only the Python standard library. It reads the committed npm and Bower manifests, verifies the recorded lockfile counts and known vendored version markers, checks the build's browser inputs, checks both rendered app variants, and checks selected external-load anchors. It does not install packages, access the network, run Docker, start a browser, load `VARS.js`, or write build output.

A passing result means the committed source still describes the recorded baseline. It is not a browser smoke result and does not prove that an image was built or deployed.

## Browser baseline status

No browser runner is included. The repository has no existing client test harness, and adding a browser framework or runner needs a separate approved choice. The source-only check is the smallest repeatable check that can run without that approval.

The runtime baseline has not been run because the deployed image, an immutable rollback image, disposable accounts/files, and an approved isolated browser environment are unavailable. These are gaps, not passing results.

| Scenario | Status | Required evidence |
|---|---|---|
| `/app.html` and `/app-plus-plus.html` each load as the actual variant; menus and editor render | Not run | Deployed image, isolated browser, and a way to reach both variants without changing subscription gating |
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

The rollback image remains **unavailable**. Do not substitute the mutable `client-base:latest` tag for a known-good client image.
