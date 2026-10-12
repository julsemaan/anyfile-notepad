# Client dependency get-well plan

## Recommendation

Do this in phased, independently releasable PRs. Keep the existing JavaScript, templates, and build architecture. A framework rewrite would delay the security fixes.

There are two milestones:

- **Containment:** patch exposed libraries and replace obsolete build tooling.
- **Recovery:** remove unsupported dependencies and make updates routine.

Source reviewed at `f7bbe8c3e70155e4aa3cb6879e2979a4e47e6dc7`. PRs #91 through #94 replaced the obsolete build toolchain, added the source inventory and checks, moved Handlebars to npm, and removed jQuery from the print window. Commit `814d513` enforces `npm ci` in `client/Dockerfile`. The branch also includes PRs #96 through #98, which update the ad script, add an ad-testing toggle, and reload the app after successful development rebuilds.

Browser migration source `6ccf2a0fe075cf41714832c66dcc2ecb4b8258d9` pins npm Handlebars 4.7.10, jQuery 3.7.1, Bootstrap 3.4.1 and Marked 18.1.1. `source-map-js` resolves to 1.2.2 through existing ranges. Source-unused jQuery UI, Cookie and the menu-change tour with Shepherd/Tether were removed, pending beta runtime confirmation. Bower remains for the pinned Ace fork.

Containment is still incomplete. Bootstrap 3 is unsupported, and both fresh audits retain 16 findings. Dropbox, Ace, the Material stack and other vendored libraries are separate follow-ups.

Next steps are one PR from `chore/frontend-get-well-contd-oct12`, full/light GHA builds, immutable image and rollback identifiers, one beta release, and sanitized browser evidence. PR #95 remains separate and unchanged.

## Findings

| Area | Current state | Status |
|---|---|---|
| Build toolchain | The client base uses pinned Node 24.20.0 and npm 11.19.0. Dart Sass is pinned to 1.104.0 and `minify` to 15.3.1. | Complete |
| npm installation | `client/package-lock.json` is lockfile version 3. `client/Dockerfile` copies both npm manifests and uses `npm ci`. The recorded local full/light build checks cover commit `5157bb9`, not the current source revision. Current GHA and deployment evidence was not verified in this update. | Implemented; current release verification open |
| Handlebars | npm 4.7.10; escaping and prototype-access checks pass. Fresh audits no longer flag it. Required minimist resolution moved to 1.2.8. | Source patch verified; browser gate open |
| Printing | The print window uses native DOM event handlers and loads no jQuery. | Complete |
| Editor | The Ace fork is pinned to `29c744e292c7fd20c8283ed528b9c12b6174a83d`. In the local image, the prebuilt `afn-dist` exists and its output was checked. `afn-app.sh` runs nested `npm install` only when `afn-dist` is absent; this image had no nested `node_modules`, and `npm ls --depth=0` reported five unmet dependencies. | Prebuilt output verified; source build unverified |
| Docker installation | The client image installs Bower. The Ace build script conditionally runs a nested npm install only when no `afn-dist` exists; the local image used the prebuilt distribution. Apt and CPAN versions are not recorded. | Partially verified |
| Browser sources | jQuery 3.7.1 and Bootstrap 3.4.1 now come from npm; Bower retains only Ace. UI, Cookie and tour inputs are removed. | Source verified; indirect runtime checks open |
| Dropbox | The client still uses the locked 2.5.13 SDK through the old integration boundary. | Unresolved |
| Remaining vendored code | Marked now comes from npm 18.1.1 at the same `/marked.js` URL; Cookie is removed. Router, RSVP, localization, material and file-tree code remain. | Marked source checks pass; browser and other migrations open |
| Source baseline | Inventory and URL assertion refreshed; all 118 assertions pass under Node 24.20.0/npm 11.19.0. | Source verified |
| Regression checks | All eight Node checks pass, including new jQuery polling/count and Marked panel/layout checks across 12 pages. They are not browser checks or GHA quality gates. | Local checks passing; CI/browser coverage open |
| External scripts | PR #96 changes the ads-enabled template to `https://otelev.com/22/17133d254dc58db1395ab65191071264`. PR #97 adds the persistent `AFNForceAds` test override. Remote scripts remain outside npm audit coverage. | URL and inventory updated; runtime review open |
| Vulnerability data | Both full and production-only audits report 16 findings: 1 low, 3 moderate, 10 high, 2 critical. Handlebars/source-map-js targeted findings are gone. Bootstrap and Dropbox tree findings remain. | Targeted patches verified; recovery incomplete |

Audits ran after clean `npm ci` under Node 24.20.0/npm 11.19.0. Both exited 1. See `client/DEPENDENCIES.md` for remaining packages and Bootstrap advisories. These are package-tree findings, not browser exploitability assessments or image scans. Do not run `npm audit fix` without reviewing compatibility impact.

## 1. Establish a trustworthy baseline

**Status: partial.** The source inventory and a user-reported browser baseline are available. Exact deployed and rollback image digests, captured browser evidence, and deployed dependency versions remain open.

- [x] Inventory the committed npm, Bower, Docker, Ace, vendored, and external-script inputs in `client/DEPENDENCIES.md`.
- [x] Add the source-only checks in `client/tests/check_baseline.py` and the print and Handlebars checks.
- [x] Refresh the dependency inventory and baseline for the ad-script URL, `npm ci`, and this browser migration.
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

**Status: source implementation verified; release gate open.** Separate commits implement the combined batch. No beta runtime or image verification is claimed.

### Handlebars

- [x] Move the vendored 4.0.5 copy to the pinned npm dependency 4.7.9.
- [x] Keep the application bundle on the npm copy and remove the vendored file.
- [x] Test templates against prototype-based models without globally enabling unsafe prototype access.
- [x] Patch to 4.7.10 and refresh source-map-js to 1.2.2; rendering and fresh audit checks pass.
- [ ] Verify templates in beta without unsafe prototype access.

### jQuery and legacy plugins

- [x] Pin full npm jQuery 3.7.1; replace `.size()` and jqXHR `.success()` with `.length` and `.done()`.
- [x] Remove jQuery UI after source/plugin inspection found no consumers.
- [ ] Confirm UI removal and compatibility in beta; use uncompressed Migrate only for diagnosis and pass final checks without it.
- [x] Remove the print window's jQuery dependency by using native DOM handlers.
- [ ] Verify material/ripples, file-tree behavior, and the custom `clone()` patch.
- [x] Remove source-unused Cookie and tour controller/initialization with Shepherd/Tether; retain native cookie helpers.
- [ ] Verify startup, cookies, menus, file-tree expansion and animations in beta. Restore an affected dependency if an indirect consumer appears.

### Bootstrap and Marked

- [x] Pin npm Bootstrap 3.4.1 as unsupported containment; copy its fonts after public assets.
- [x] Pin npm Marked 18.1.1, publish its UMD at `/marked.js`, and adapt panel parsing/rendering.
- [x] Exercise all 12 committed pages and focused formatting/delimiter/column cases. Document trusted first-party content only; Marked is not a sanitizer.
- [ ] Compare home, FAQ, contact and payment pages in the browser; verify fonts, links, content and layout.

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

Validated browser migration source `6ccf2a0fe075cf41714832c66dcc2ecb4b8258d9` under Node 24.20.0/npm 11.19.0. Final documentation commits must also be included in the release SHA.

- Clean `npm ci` passed without changing the lockfile. Its 246 entries include optional platform packages; the local installed package count is smaller.
- All 118 baseline assertions and eight Node checks passed. The Handlebars prototype/escaping checks remain intact. New checks cover Flash counts, collaboration polling/event delivery/retries, and Markdown across all 12 committed pages.
- An isolated run of the existing asset functions passed Sass, concatenation, JS/CSS minification, minified JS syntax, exact npm font/Marked copies, and absence of removed library inputs. This was not the full app build.
- Full and production-only audits both exited 1 with 16 findings: 1 low, 3 moderate, 10 high, 2 critical. Handlebars and source-map-js are absent from both reports. Bootstrap's two moderate advisories and the old Dropbox dependency tree remain. This is containment, not full recovery.
- Supplied-diff agent review found no important code issues. It did not independently run tests or inspect images.
- Docker has no daemon, Perl lacks `Template`, Ace is absent locally, and the sandbox has no usable browser. Full/light GHA builds, both generated app variants, Ace assets, beta runtime checks, and sanitized evidence remain open.

| Release evidence | Current result |
|---|---|
| Source tested | `6ccf2a0fe075cf41714832c66dcc2ecb4b8258d9` |
| Final release source SHA | Open, include final documentation commit |
| Full/light GHA run and image tags/digests | Open |
| Retrievable known-good rollback image | Open; historical run is not proof of current rollback |
| Beta deployment | Not performed |
| Sanitized browser evidence | Not captured |
| UI/Cookie/tour removal confirmation | Source only; beta confirmation open |

Use the full checklist in `client/tests/README.md` before closing this batch. It includes paid/ad-free behavior with `AFNForceAds` disabled, ads, both cloud providers, hostile filenames, autosave, printing, preferences, keyboard focus, menus, animations, cloned controls, desktop/mobile layout, two-browser collaboration, representative site pages, font requests, console errors and failed requests. Restore an affected removed dependency if an indirect consumer appears.

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
