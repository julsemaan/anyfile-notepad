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
| npm installation | `client/package-lock.json` is lockfile version 3. `client/Dockerfile` copies both npm manifests and uses `npm ci`. A local full-image build on the current commit passed output checks under Node 24.20.0 and npm 11.19.0. The current commit has not yet been built and deployed to beta. | Local build verified; beta check pending |
| Handlebars | Handlebars 4.7.9 is managed by npm and appended from `node_modules`. The vendored copy is gone. | Complete |
| Printing | The print window uses native DOM event handlers and loads no jQuery. | Complete |
| Editor | The Ace fork is pinned to `29c744e292c7fd20c8283ed528b9c12b6174a83d`. In the local image, the prebuilt `afn-dist` exists and its output was checked. `afn-app.sh` runs nested `npm install` only when `afn-dist` is absent; this image had no nested `node_modules`, and `npm ls --depth=0` reported five unmet dependencies. | Prebuilt output verified; source build unverified |
| Docker installation | The client image installs Bower. The Ace build script conditionally runs a nested npm install only when no `afn-dist` exists; the local image used the prebuilt distribution. Apt and CPAN versions are not recorded. | Partially verified |
| Bower libraries | The local full image resolved Bootstrap 3.1.1, jQuery 1.11.3, jQuery UI 1.11.4, and Ace commit `29c744e292c7fd20c8283ed528b9c12b6174a83d`. There is no Bower lockfile; these resolutions have not been inspected in the deployed image. | Local image recorded; deployed image open |
| Dropbox | The client still uses the locked 2.5.13 SDK through the old integration boundary. | Unresolved |
| Remaining vendored code | Marked, the router, RSVP, localization, material scripts, jQuery Cookie, file-tree code, and other vendored assets remain. | Unresolved |
| Vulnerability data | The latest `npm audit --package-lock-only --ignore-scripts` and `npm audit --omit=dev --package-lock-only --ignore-scripts` runs both reported 16 findings (1 low, 2 moderate, 10 high, 3 critical). Some findings trace through Dropbox 2.5.13. These are npm dependency-tree results, not evidence of browser exploitability; Bower, shipped assets, and image contents still need separate scans. | npm audit done; exposure assessment open |

The npm audit results above are a current package-tree snapshot from this session, not a browser exploitability assessment or complete release scan. Do not run `npm audit fix` without reviewing the Dropbox and SDK compatibility impact. Scan shipped assets and the builder and final images separately before setting priorities.

## 1. Establish a trustworthy baseline

**Status: partial.** The source inventory and a user-reported browser baseline are available. Exact deployed and rollback image digests, captured browser evidence, and deployed dependency versions remain open.

- [x] Inventory the committed npm, Bower, Docker, Ace, vendored, and external-script inputs in `client/DEPENDENCIES.md`.
- [x] Add the source-only checks in `client/tests/check_baseline.py` and the print and Handlebars checks.
- [ ] Record the versions installed in the deployed image. Local-image Bower resolutions are recorded above; the deployed image and Ace nested build were not inspected.
- [ ] Record and verify the deployed beta image digest and a retrievable rollback image digest. The current beta is reported to use artifacts from GHA run `34271951657`, which built commit `7c7d328abe666e2f505448b0f7323c5661b2301e`; preserve its image tag while testing the next build.
- [ ] Save sanitized screenshots, Console output, and Network evidence. The user reports completing the beta app browser tests, but artifacts and exact scenario results were not shared.
- [x] User reports completing the necessary app browser tests on beta at `https://app.v4geo-beta.semaan.ca/` against the image from GHA run `34271951657`.
- [ ] Record results for representative site pages and confirm the full smoke checklist, including file save/reload, printing, and two-browser collaboration.

The baseline is useful for before/after comparison, but its evidence is user-reported and tied to the older image. Keep the exit gate open until image and rollback identifiers and browser evidence are recorded. Any demonstrated exploitable issue gets a separate hotfix immediately.

## 2. Replace obsolete build tooling and enforce the lockfile

**Status: partial.** The current commit built locally with the locked npm install. Browser verification against that image is still open.

- [x] Replace Node Sass with Dart Sass 1.104.0.
- [x] Upgrade `minify` to 15.3.1 and keep the existing concatenation pipeline.
- [x] Move the builder to pinned Node 24.20.0 and npm 11.19.0 on the pinned Debian base.
- [x] Replace unbounded build dependency declarations with pinned versions.
- [x] Regenerate the lockfile under the selected Node and npm versions.
- [x] Separate runtime and build dependencies in `client/package.json`.
- [x] Pin the client-base image in `client/Dockerfile`.
- [x] Confirm that the pinned Ace fork builds under Node 24.
- [x] Copy `package.json` and `package-lock.json` before installation and use `npm ci` in `client/Dockerfile`.
- [x] Build the current commit locally. The full image reported Node 24.20.0 and npm 11.19.0; output checks passed for both app variants, the home page, Ace, and minified JS/CSS. The derived light image passed the corresponding output checks.
- [ ] Build the current commit in GHA and record the full and light image tags/digests.
- [ ] Deploy that image to beta, retain the existing beta image as rollback, and rerun the browser checks against the new image.
- [ ] Verify generated CSS, font and image paths, minified JavaScript, both app variants, and site pages in the browser.

The phase 2 exit gate stays open until the current image is built in GHA, tested in beta, and the browser checks pass. Keep the nested Ace installation behavior unchanged until the Ace migration.

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

## Validation and progress update

- `python3 client/tests/check_baseline.py`: passed (100 checks).
- `node client/tests/print-source-check.js`: passed.
- `node client/tests/handlebars.js`: passed.
- Local full-image build for commit `5157bb938655497268691c984c5659f327f7d5c4`: user-confirmed output checks passed; Node 24.20.0 and npm 11.19.0. The light-image output checks also exited successfully. Build logs and image digests were not saved here.
- Local Bower resolutions: jQuery 1.11.3, jQuery UI 1.11.4, Bootstrap 3.1.1, Ace commit `29c744e292c7fd20c8283ed528b9c12b6174a83d`. Ace `afn-dist` was present; nested `node_modules` was absent. `npm ls --depth=0` exited 1 with five unmet dependencies, consistent with the build script skipping nested installation when prebuilt `afn-dist` exists.
- `npm audit --package-lock-only --ignore-scripts` and `npm audit --omit=dev --package-lock-only --ignore-scripts`: each reported 16 findings (1 low, 2 moderate, 10 high, 3 critical). These scans do not cover Bower, vendored assets, or image contents, and do not prove browser exploitability.
- Browser: user reports completing the beta app tests successfully at `https://app.v4geo-beta.semaan.ca/`. GHA run `34271951657` completed successfully on `master` at `7c7d328abe666e2f505448b0f7323c5661b2301e`, before the `npm ci` Dockerfile change. The current commit `5157bb938655497268691c984c5659f327f7d5c4` has not yet been deployed to beta. Screenshots, sanitized Console/Network output, and deployed/rollback image digests were not provided.
- Next: build the current commit in GHA, record image tags/digests, deploy to beta with the old image retained for rollback, and repeat the browser checks before closing phase 2.

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
