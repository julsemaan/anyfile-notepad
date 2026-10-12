# Client dependency get-well plan

## Recommendation

Do this in phased, independently releasable PRs. Keep the existing JavaScript, templates, and build architecture. A framework rewrite would delay the security fixes.

There are two milestones:

- **Containment:** patch exposed libraries and replace obsolete build tooling.
- **Recovery:** remove unsupported dependencies and make updates routine.

Source reviewed at `f7bbe8c3e70155e4aa3cb6879e2979a4e47e6dc7`. PRs #91 through #94 replaced the obsolete build toolchain, added the source inventory and checks, moved Handlebars to npm, and removed jQuery from the print window. Commit `814d513` enforces `npm ci` in `client/Dockerfile`. The branch also includes PRs #96 through #98, which update the ad script, add an ad-testing toggle, and reload the app after successful development rebuilds.

Containment is still incomplete. The tooling and lockfile work is implemented, but release verification remains open. The fresh npm audit flags Handlebars 4.7.9, and the source baseline check fails because it still expects the previous ad-script URL. Dropbox, Ace, jQuery, Bootstrap, Bower, and the remaining vendored libraries have not been migrated.

Immediate next steps:

1. Review the new Handlebars advisories and update the pin and lockfile to a fixed release, with template regression checks. npm audit currently proposes 4.7.10.
2. Refresh the stale external-script inventory and baseline assertion, then rerun the source check.
3. Record current full/light image and rollback identifiers, then repeat beta browser checks before closing phase 2.
4. Continue phase 3 compatibility work, with Dropbox and Ace kept in separate migrations.

## Findings

| Area | Current state | Status |
|---|---|---|
| Build toolchain | The client base uses pinned Node 24.20.0 and npm 11.19.0. Dart Sass is pinned to 1.104.0 and `minify` to 15.3.1. | Complete |
| npm installation | `client/package-lock.json` is lockfile version 3. `client/Dockerfile` copies both npm manifests and uses `npm ci`. The recorded local full/light build checks cover commit `5157bb9`, not the current source revision. Current GHA and deployment evidence was not verified in this update. | Implemented; current release verification open |
| Handlebars | Handlebars 4.7.9 is managed by npm and appended from `node_modules`; the vendored copy is gone. The rendering check passes, but the fresh npm audit flags critical advisories and proposes 4.7.10. | npm migration complete; security patch open |
| Printing | The print window uses native DOM event handlers and loads no jQuery. | Complete |
| Editor | The Ace fork is pinned to `29c744e292c7fd20c8283ed528b9c12b6174a83d`. In the local image, the prebuilt `afn-dist` exists and its output was checked. `afn-app.sh` runs nested `npm install` only when `afn-dist` is absent; this image had no nested `node_modules`, and `npm ls --depth=0` reported five unmet dependencies. | Prebuilt output verified; source build unverified |
| Docker installation | The client image installs Bower. The Ace build script conditionally runs a nested npm install only when no `afn-dist` exists; the local image used the prebuilt distribution. Apt and CPAN versions are not recorded. | Partially verified |
| Bower libraries | The local full image resolved Bootstrap 3.1.1, jQuery 1.11.3, jQuery UI 1.11.4, and Ace commit `29c744e292c7fd20c8283ed528b9c12b6174a83d`. There is no Bower lockfile; these resolutions have not been inspected in the deployed image. | Local image recorded; deployed image open |
| Dropbox | The client still uses the locked 2.5.13 SDK through the old integration boundary. | Unresolved |
| Remaining vendored code | Marked, the router, RSVP, localization, material scripts, jQuery Cookie, file-tree code, and other vendored assets remain. | Unresolved |
| Source baseline | `client/DEPENDENCIES.md` and the 100-check source baseline exist, but both still record the old ad-script URL. The check currently fails on that assertion. The inventory also predates the `npm ci` change. | Refresh needed |
| Regression checks | Print, Handlebars, ad-testing, development reload, editor unload, and collaboration departure checks pass locally. They are Node checks, not browser smoke tests, and are not wired into the client image workflow. | Local checks passing; CI and browser coverage open |
| External scripts | PR #96 changes the ads-enabled template to `https://otelev.com/22/17133d254dc58db1395ab65191071264`. PR #97 adds the persistent `AFNForceAds` test override. Remote scripts remain outside npm audit coverage. | URL updated; inventory and runtime review open |
| Vulnerability data | Fresh lockfile audits report 18 findings across all dependencies: 1 low, 2 moderate, 11 high, 4 critical. Omitting dev dependencies reports 17: 1 low, 2 moderate, 10 high, 4 critical. Handlebars and the old Dropbox tree are flagged; `source-map-js` adds a build-only high finding. | Audit refreshed; fixes and exposure assessment open |

The npm audit results above were refreshed against copies of the committed manifests using local npm 11.12.1. They are package-tree findings, not a browser exploitability assessment or complete release scan. The previous snapshot reported 16 findings in both scans; unchanged manifests do not imply unchanged advisory data. Do not run `npm audit fix` without reviewing the Dropbox and SDK compatibility impact. Scan shipped assets and the builder and final images separately before setting priorities.

## 1. Establish a trustworthy baseline

**Status: partial.** The source inventory and a user-reported browser baseline are available. Exact deployed and rollback image digests, captured browser evidence, and deployed dependency versions remain open.

- [x] Inventory the committed npm, Bower, Docker, Ace, vendored, and external-script inputs in `client/DEPENDENCIES.md`.
- [x] Add the source-only checks in `client/tests/check_baseline.py` and the print and Handlebars checks.
- [ ] Refresh `client/DEPENDENCIES.md` and `client/tests/check_baseline.py` for the ad-script change in PR #96. Update the inventory's old `npm install` description to match `npm ci`; keep its historical audit clearly labeled.
- [ ] Record the versions installed in the deployed image. Local-image Bower resolutions are recorded above; the deployed image and Ace nested build were not inspected.
- [ ] Record and verify the deployed beta image digest and a retrievable rollback image digest. The previously reported beta baseline used artifacts from GHA run `34271951657`, which built commit `7c7d328abe666e2f505448b0f7323c5661b2301e`. That is historical evidence, not confirmation of the current deployment; identify and retain the actual known-good image before testing the next build.
- [ ] Save sanitized screenshots, Console output, and Network evidence. The user reports completing the beta app browser tests, but artifacts and exact scenario results were not shared.
- [x] User reports completing the necessary app browser tests on beta at `https://app.v4geo-beta.semaan.ca/` against the image from GHA run `34271951657`.
- [ ] Record results for representative site pages and confirm the full smoke checklist, including file save/reload, printing, and two-browser collaboration.

The baseline is useful for before/after comparison, but its evidence is user-reported and tied to the older image. Keep the exit gate open until image and rollback identifiers and browser evidence are recorded. Any demonstrated exploitable issue gets a separate hotfix immediately.

## 2. Replace obsolete build tooling and enforce the lockfile

**Status: implemented; release gate open.** The locked npm installation and supported build-tool replacements are committed. The recorded local build checks cover `5157bb9`; a build and browser run for the current source revision were not verified here.

- [x] Replace Node Sass with Dart Sass 1.104.0.
- [x] Upgrade `minify` to 15.3.1 and keep the existing concatenation pipeline.
- [x] Move the builder to pinned Node 24.20.0 and npm 11.19.0 on the pinned Debian base.
- [x] Replace unbounded build dependency declarations with pinned versions.
- [x] Regenerate the lockfile under the selected Node and npm versions.
- [x] Separate runtime and build dependencies in `client/package.json`.
- [x] Pin the client-base image in `client/Dockerfile`.
- [x] Confirm that the pinned Ace fork's prebuilt `afn-dist` is copied into the local image under Node 24.
- [ ] Verify a source build of the pinned Ace fork under Node 24. The recorded local image skipped its nested installation and compilation because `afn-dist` was already present.
- [x] Copy `package.json` and `package-lock.json` before installation and use `npm ci` in `client/Dockerfile`.
- [x] Build commit `5157bb9` locally. The full image reported Node 24.20.0 and npm 11.19.0; user-confirmed output checks passed for both app variants, the home page, prebuilt Ace assets, and minified JS/CSS. The derived light image passed the corresponding output checks.
- [ ] Build the current commit in GHA and record the full and light image tags/digests.
- [ ] Deploy that image to beta, retain the existing beta image as rollback, and rerun the browser checks against the new image.
- [ ] Verify generated CSS, font and image paths, minified JavaScript, both app variants, and site pages in the browser.

The phase 2 exit gate stays open until the current image is built in GHA, tested in beta, and the browser checks pass. Keep the nested Ace installation behavior unchanged until the Ace migration.

[Node Sass is end-of-life](https://sass-lang.com/blog/node-sass-is-end-of-life/), so upgrading it to its final version is not a durable fix.

## 3. Patch browser dependencies without redesigning the UI

**Status: partial.** The Handlebars npm migration and print-window cleanup are implemented. Handlebars needs another security patch; the remaining browser dependencies still need separate compatibility work.

### Handlebars

- [x] Move the vendored 4.0.5 copy to the pinned npm dependency 4.7.9.
- [x] Keep the application bundle on the npm copy and remove the vendored file.
- [x] Test templates against prototype-based models without globally enabling unsafe prototype access.
- [ ] Review the fresh advisories affecting 4.7.9 and move to a fixed release. npm audit proposes 4.7.10; verify the release and rerun rendering and browser checks. The npm migration is complete, but the security exit gate is not.

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

The baseline inventory, local regression checks, fresh lockfile audits, and recorded production-build validation are phase 6 groundwork. `.github/workflows/docker-client.yml` builds full and light images, but does not run the client checks, audit dependencies, scan images, or run browser smoke tests. No dependency-update bot configuration is committed. Changes to build and deployment workflows require approval before implementation.

## Definition of done

The client installs from one enforced lockfile, builds on supported tooling, and ships no unidentified dependency copies. Unsupported libraries are removed or covered by explicit temporary exceptions. Every phase leaves a tested, releasable client.

Start with phases 1 through 3. They deliver the fastest security improvement. Schedule phases 4 and 5 as separate migration work, but do not call Bootstrap 3.4.1 or jQuery 3.7.1 the permanent endpoint.

## Validation and progress update

### Current source checks

Reviewed source at `f7bbe8c3e70155e4aa3cb6879e2979a4e47e6dc7`. Local checks used Node 25.9.0 and npm 11.12.1, not the pinned image toolchain.

- `python3 client/tests/check_baseline.py`: failed on the obsolete `parchmentuniquevista.com` ad-script assertion. The script contains 100 checks and reported no other failures. PR #96 changed the template URL; this is stale baseline evidence, not a demonstrated runtime regression.
- `node client/tests/print-source-check.js` and `node client/tests/handlebars.js`: passed with the existing local Handlebars installation.
- `node client/tests/ad-testing.js`, `node client/tests/dev-reload.js`, `node client/tests/editor-unload.js`, and `node client/tests/realtime-departure.js`: passed. PRs #97 and #98 add these regression checks; they do not establish browser or deployment success.
- `npm audit --package-lock-only --ignore-scripts --json`: exit 1, 18 findings, comprising 1 low, 2 moderate, 11 high, and 4 critical.
- The same audit with `--omit=dev`: exit 1, 17 findings, comprising 1 low, 2 moderate, 10 high, and 4 critical. Both audits ran against temporary copies of the committed manifests without changing the repository.
- Handlebars 4.7.9 is flagged by [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), and [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f). npm audit proposes 4.7.10. The build-only `source-map-js` finding is [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). These findings still require application-specific exposure assessment.

### Historical build and browser evidence

- Local full-image build for commit `5157bb938655497268691c984c5659f327f7d5c4`: user-confirmed output checks passed; Node 24.20.0 and npm 11.19.0. The light-image output checks also exited successfully. Build logs and image digests were not saved here. No image build was rerun for this documentation update.
- Recorded local Bower resolutions: jQuery 1.11.3, jQuery UI 1.11.4, Bootstrap 3.1.1, Ace commit `29c744e292c7fd20c8283ed528b9c12b6174a83d`. Ace `afn-dist` was present; nested `node_modules` was absent. `npm ls --depth=0` exited 1 with five unmet dependencies, consistent with skipping nested installation when prebuilt `afn-dist` exists. This does not verify compilation from source.
- Browser: the earlier update records user-reported successful beta app tests at `https://app.v4geo-beta.semaan.ca/` against GHA run `34271951657`, built from `7c7d328abe666e2f505448b0f7323c5661b2301e`. That predates the `npm ci` change and PRs #96 through #98. Current deployment status, sanitized browser artifacts, and deployed/rollback image digests were not verified here.
- Before closing phase 2, record the current image tags/digests and rollback image, then repeat the full browser checklist. Include paid/ad-free behavior with `AFNForceAds` disabled, the ads-enabled variant, printing, save/reload, representative site pages, and two-browser collaboration.

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
