# Client dependency get-well plan

## Recommendation

Do this in phased, independently releasable PRs. Keep the existing JavaScript, templates, and build architecture. A framework rewrite would delay the security fixes.

There are two milestones:

- **Containment:** patch exposed libraries and replace obsolete build tooling.
- **Recovery:** remove unsupported dependencies and make updates routine.

This branch now includes the four merged client changes from `origin/master`, PRs #91 through #94. They replace the obsolete build toolchain, add the source inventory and checks, move Handlebars to npm, and remove jQuery from the print window. The only additional work here is the plan update and the locked-install change in `client/Dockerfile`.

## Findings

| Area | Current state | Status |
|---|---|---|
| Build toolchain | The client base uses pinned Node 24.20.0 and npm 11.19.0. Dart Sass is pinned to 1.104.0 and `minify` to 15.3.1. | Complete |
| npm installation | `client/package-lock.json` is lockfile version 3. `client/Dockerfile` now copies both npm manifests and uses `npm ci`. Bower and the nested Ace build still install separately. | Install evidence open |
| Handlebars | Handlebars 4.7.9 is managed by npm and appended from `node_modules`. The vendored copy is gone. | Complete |
| Printing | The print window uses native DOM event handlers and loads no jQuery. | Complete |
| Editor | The Ace fork is pinned to commit `29c744e292c7fd20c8283ed528b9c12b6174a83d`. The merged toolchain work confirmed that it builds under Node 24. Its nested npm install remains. | Migration open |
| Docker installation | The client image still installs Bower and the nested Ace dependencies. The apt and CPAN versions are not recorded. | Unresolved |
| Bower libraries | Bower still supplies Bootstrap 3.1.1, jQuery 1.11, jQuery UI 1.11, and the Ace fork. There is no Bower lockfile. | Unresolved |
| Dropbox | The client still uses the locked 2.5.13 SDK through the old integration boundary. | Unresolved |
| Remaining vendored code | Marked, the router, RSVP, localization, material scripts, jQuery Cookie, file-tree code, and other vendored assets remain. | Unresolved |
| Vulnerability data | Existing audit reports disagree and do not establish browser exploitability. | Fresh audit required |

Do not record a current vulnerability count in this plan. Run a fresh npm audit, shipped-asset scan, and separate builder and final-image scans before using vulnerability results to set priorities. The dated result in `client/DEPENDENCIES.md` is source evidence, not a current release assessment.

## 1. Establish a trustworthy baseline

**Status: partial.** The source dependency inventory is complete. The deployed-image and browser baseline are not.

- [x] Inventory the committed npm, Bower, Docker, Ace, vendored, and external-script inputs in `client/DEPENDENCIES.md`.
- [x] Add the source-only checks in `client/tests/check_baseline.py` and the print and Handlebars checks.
- [ ] Record the versions actually installed in the deployed client image, including Bower and the nested Ace build.
- [ ] Identify a known-good deployed image and a rollback image.
- [ ] Capture browser screenshots, console output, and network evidence.
- [ ] Run the smoke suite for opening, editing, saving, autosave, file browsing, printing, preferences, dialogs, and two-browser collaboration.
- [ ] Cover `/app.html`, `/app-plus-plus.html`, and representative site pages.

The exit gate remains open. The deployed image, rollback image, disposable accounts and files, approved browser runner, screenshots, and browser smoke results are still missing. Any demonstrated exploitable issue gets a separate hotfix immediately.

## 2. Replace obsolete build tooling and enforce the lockfile

**Status: partial.** The toolchain changes are complete. Clean locked-install evidence and browser verification are still open.

- [x] Replace Node Sass with Dart Sass 1.104.0.
- [x] Upgrade `minify` to 15.3.1 and keep the existing concatenation pipeline.
- [x] Move the builder to pinned Node 24.20.0 and npm 11.19.0 on the pinned Debian base.
- [x] Replace unbounded build dependency declarations with pinned versions.
- [x] Regenerate the lockfile under the selected Node and npm versions.
- [x] Separate runtime and build dependencies in `client/package.json`.
- [x] Pin the client-base image in `client/Dockerfile`.
- [x] Confirm that the pinned Ace fork builds under Node 24.
- [x] Copy `package.json` and `package-lock.json` before installation and use `npm ci` in `client/Dockerfile`.
- [ ] Demonstrate a clean `npm ci` and production Docker build.
- [ ] Verify generated CSS, font and image paths, minified JavaScript, both app variants, and site pages in a browser.

The phase 2 exit gate stays open until the clean install and production build are evidenced and the browser checks pass. Keep the nested Ace installation unchanged until the Ace migration.

[Node Sass is end-of-life](https://sass-lang.com/blog/node-sass-is-end-of-life/), so upgrading it to its final version is not a durable fix.

## 3. Patch browser dependencies without redesigning the UI

**Status: partial.** Handlebars and the print window are complete. The remaining browser dependencies still need separate compatibility work.

### Handlebars

- [x] Move the vendored 4.0.5 copy to the pinned npm dependency 4.7.9.
- [x] Keep the application bundle on the npm copy and remove the vendored file.
- [x] Test templates against prototype-based models without globally enabling unsafe prototype access.

### jQuery and legacy plugins

- [ ] Upgrade to jQuery 3.7.1 as a compatibility bridge, then use jQuery Migrate during testing and remove it.
- [ ] Check whether jQuery UI is needed. Remove it only after checking plugins and browser behavior; otherwise upgrade it to a compatible release.
- [x] Remove the print window's jQuery dependency by using native DOM handlers.
- [ ] Verify material/ripples, file-tree behavior, and the custom `clone()` patch.
- [ ] Confirm whether `jquery.cookie` and the old tour are unused, then remove them if runtime checks support it.

### Bootstrap and Marked

- [ ] Upgrade Bootstrap 3.1.1 to 3.4.1 only as temporary containment.
- [ ] Replace the unversioned Marked copy with a pinned maintained release and adapt `client/assets/js/MDRenderer.js` to its token format.
- [ ] Test the existing site panel layout and raw HTML behavior. Confirm the content trust boundary because a Markdown parser is not an HTML sanitizer.

The exit gate requires no old duplicate libraries in bundles or print/network requests, passing smoke checks, and no JavaScript execution from malicious filenames or rendered content.

Bootstrap 3.4.1 is not the finish line. Bootstrap 3 is unsupported, and remaining advisories must be recorded as explicit temporary exceptions or fixed.

## 4. Migrate Dropbox and Ace independently

These are the highest data-loss risks. Do not combine them in one PR.

### Dropbox

Upgrade to the current supported SDK after reviewing each intervening breaking change. The existing code assumes authentication methods live directly on the client, authentication URL generation is synchronous, response fields are directly accessible, and errors have the old SuperAgent structure. Adapt those assumptions at the existing `DropboxRequest` boundary where possible.

**Exit gate:** sign-in, restored sessions, listing, download, create, overwrite, expired authorization, and network failure all work. Failed saves must preserve editor contents and must not mark data saved.

Authentication-flow or token-storage changes require a separate approved decision, not a silent side effect of the SDK update.

### Ace

Compare the custom fork with upstream and identify required changes. Prefer the maintained `ace-builds` distribution over compiling the old fork during every build. Preserve existing asset URLs, modes, themes, keyboard bindings, and completion behavior. Test collaboration specifically, including remote edits and prevention of rebroadcast loops.

**Ace exit gate:** edit, save, and reload round trips preserve content, all referenced Ace assets load, and two-browser collaboration passes.

Once no dependencies remain in Bower, remove `client/bower.json`, Bower, and its Docker installation and copy steps.

## 5. Finish unsupported UI dependencies

Move Bootstrap 3 to the maintained Bootstrap 5 line in a separate compatibility migration, split by UI section.

- Replace the old Bootstrap Material integration with existing CSS and native controls where practical.
- Migrate dialogs, menus, forms, site panels, utility classes, and icons in small reviewed sections.
- Keep jQuery for application code. Removing it wholesale is unnecessary.
- Consider jQuery 4 only after incompatible plugins are gone.
- Account for the remaining vendored router, RSVP, localization, and other libraries. Give each one a pinned source and an explicit retain, update, or replace decision.
- Do not blindly rename `tether-shepherd` to `shepherd.js`. The current package has API and licensing changes. Removing an unused tour is preferable, subject to confirmation.

The exit gate requires no unsupported Bootstrap or material stack, passing desktop and mobile screenshots, keyboard navigation, focus handling, and both app variants.

## 6. Prevent another backlog

Start this during phase 2 and tighten the gates as findings are cleared.

- Configure one dependency-update bot for weekly grouped patch and minor PRs, with major upgrades separate.
- Add CI checks for clean installation, production builds, and browser smoke tests.
- Audit all npm dependencies, scan shipped assets for vendored libraries, and scan builder and final images separately.
- Block new high and critical findings initially. At completion, require no unresolved high or critical findings without an approved, expiring exception.
- Track lower-severity exploitable findings too. Severity alone must not determine priority.
- Review external scripts separately, including `client/public/sw.js`. npm cannot audit remotely loaded code.
- Use the existing beta route for each phase, then promote after verification. Roll back by image tag rather than rebuilding historical manifests.

The baseline inventory, source checks, and production-build validation are phase 6 groundwork. They do not complete dependency-update automation, fresh audits, image scanning, or browser CI. Changes to build and deployment workflows require approval before implementation.

## Definition of done

The client installs from one enforced lockfile, builds on supported tooling, and ships no unidentified dependency copies. Unsupported libraries are removed or covered by explicit temporary exceptions. Every phase leaves a tested, releasable client.

Start with phases 1 through 3. They deliver the fastest security improvement. Schedule phases 4 and 5 as separate migration work, but do not call Bootstrap 3.4.1 or jQuery 3.7.1 the permanent endpoint.

## Validation for this update

- `python3 client/tests/check_baseline.py`: passed.
- `node client/tests/print-source-check.js`: passed.
- `node client/tests/handlebars.js`: passed after a local `npm ci`.
- Local `npm ci`: passed under Node 25.9.0 and npm 11.12.1; this does not replace the pinned production-image check.
- Production Docker build: blocked because the local Docker daemon is unavailable.
- No application-runtime, auth, subscription, or deployment files changed after the `origin/master` merge. The Dockerfile installation change is intentional.

## References

- [Node Sass end-of-life](https://sass-lang.com/blog/node-sass-is-end-of-life/)
- [Node.js release support](https://nodejs.org/en/about/previous-releases)
- [jQuery 3 upgrade guide](https://jquery.com/upgrade-guide/3.0/)
- [jQuery 4 upgrade guide](https://jquery.com/upgrade-guide/4.0/)
- [Bootstrap end-of-life status](https://getbootstrap.com/docs/4.6/end-of-life/)
- [Bootstrap 3.4.1 security release](https://blog.getbootstrap.com/2019/02/13/bootstrap-4-3-1-and-3-4-1/)
- [Bootstrap 3.4.1 advisory](https://github.com/advisories/GHSA-q58r-hwc8-rm9j)
- [Handlebars runtime and prototype-access options](https://handlebarsjs.com/api-reference/runtime-options.html)
- [Dropbox SDK upgrade guide](https://github.com/dropbox/dropbox-sdk-js/blob/main/UPGRADING.md)
- [Custom Ace fork](https://github.com/julsemaan/ace/tree/anyfile-notepad-v1.3.3)
