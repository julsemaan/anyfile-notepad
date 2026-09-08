# Client dependency get-well plan

## Recommendation

Do this in phased, independently releasable PRs. Keep the existing JavaScript, templates, and build architecture. A framework rewrite would delay the security fixes.

There are two milestones:

- **Containment:** patch exposed libraries and replace obsolete build tooling.
- **Recovery:** remove unsupported dependencies and make updates routine.

## Findings

| Area | Current state | Consequence |
|---|---|---|
| npm | Five direct dependencies; lockfile contains 252 package names | A live advisory lookup matched 29 package names. These are not necessarily exploitable browser vulnerabilities. |
| Installation | `client/Dockerfile` runs `npm install` before copying the lockfile | The committed lockfile does not describe production builds reliably. |
| Build tools | Node 16/Buster, locked `node-sass` 4.14.1, `minify` 2.1.8 | Unsupported tooling and vulnerable transitive dependencies. |
| Browser libraries | Bower supplies jQuery ~1.11, jQuery UI ~1.11, Bootstrap 3.1.1 | npm auditing misses these libraries entirely. |
| Vendored code | Handlebars 4.0.5, old Marked, several legacy plugins | More dependencies outside package-manager tracking. |
| Printing | Loads jQuery 1.11.3 directly from a CDN | Updating the main bundle alone leaves an old copy active. |
| Editor | Custom Ace 1.3.3 fork, built using another `npm install` | An additional dependency tree and a compatibility risk. |
| Dropbox | Locked SDK 2.5.13 | Current SDK migration changes authentication APIs, responses, and errors. |

This plan is based on source inspection and package metadata/advisory queries. No dependencies were installed, images built, or running application tested. Recheck release versions and advisories when implementing each phase.

## 1. Establish a trustworthy baseline

**Scope:** one preparation PR.

- Record the versions actually installed in the currently deployed client image, including Bower and the nested Ace build. Do not assume they match `package-lock.json`.
- Inventory vendored JavaScript, CSS, and externally loaded scripts. Record version or source commit, usage, and known advisories.
- Classify findings as shipped browser code, build/install code, or unused code that can be removed.
- Establish a small browser smoke suite and capture baseline screenshots.

Cover opening, editing, saving, autosave, file browsing, printing, preferences, dialogs, and two-browser collaboration. Include both `/app.html` and `/app-plus-plus.html`, plus site pages.

**Files:** `client/package.json`, a small proposed `client/tests/` suite, and dependency inventory documentation.

**Exit gate:** a reproducible baseline and a known-good image available for rollback. Any demonstrated exploitable issue gets a separate hotfix immediately.

## 2. Replace obsolete build tooling and enforce the lockfile

**Scope:** two coordinated PRs, toolchain first, deterministic installation second.

- Replace `node-sass` with Dart Sass.
- Upgrade `minify` to a maintained release. Keep the existing concatenation pipeline rather than introduce a bundler.
- Move the builder to Node 24 LTS on a supported Debian base.
- Replace unbounded dependency ranges with deliberate versions and regenerate the lockfile under the selected Node/npm versions.
- Change the Dockerfile to copy both manifests before installation and use `npm ci`.
- Separate build tools from browser dependencies in `package.json`, but continue auditing both.
- Pin the client-base image to a version or digest instead of `latest`.

**Files:**

- `client/package.json`, `client/package-lock.json`
- `client/afn-app.sh`, also exposed through the root symlink
- `client/base/Dockerfile`, `client/Dockerfile`
- Matching client/base workflows where necessary

**Important blocker:** the Ace fork runs its own old build tooling. Test that early. If it prevents the supported Node upgrade, bring the Ace work from phase 4 forward rather than restore obsolete Node.

**Exit gate:**

- Clean installation and production build succeed.
- Generated CSS, font/image paths, and minified JavaScript work.
- No changes to the existing output-directory safety checks.
- Both app variants and site pages pass smoke checks.

[Node Sass is end-of-life](https://sass-lang.com/blog/node-sass-is-end-of-life/), so upgrading it to its final version is not a durable fix.

## 3. Patch browser dependencies without redesigning the UI

**Scope:** several small PRs. Start urgent patches alongside phase 2 where practical.

### Handlebars

Move the vendored 4.0.5 copy to a pinned npm dependency. The registry reported **4.7.9** during planning.

Test templates against the application's prototype-based models. Newer Handlebars restricts prototype access. Fix affected template inputs or helpers; **do not globally re-enable unsafe prototype access**.

**Files:** manifests, build script, `client/assets/js/HBRenderer.js`, affected templates, removal of the old vendored copy.

### jQuery and legacy plugins

- Upgrade to **jQuery 3.7.1 as a compatibility bridge**, not directly to 4.
- Use jQuery Migrate during testing to identify required fixes, then remove it.
- Check whether jQuery UI is actually needed. Source inspection found no obvious widget calls in application code. Remove it only after checking plugins and browser behavior; otherwise upgrade to the current compatible release.
- Remove the print window's CDN dependency by converting its small event handlers to native DOM APIs.
- Verify material/ripples, file-tree behavior, and the custom `clone()` patch.
- Investigate removal of `jquery.cookie` and the old tour. Source inspection found no application calls to `$.cookie` or `menu_change_tour`, but that needs runtime confirmation.

**Files:** manifests, build script, `client/print.tt`, `client/assets/js/Controller/Editor.js`, affected plugins and controllers.

### Bootstrap and Marked

- Upgrade Bootstrap **3.1.1 → 3.4.1 only as temporary containment**.
- Replace the unversioned Marked copy with a pinned maintained release and adapt `client/assets/js/MDRenderer.js` to its token format.
- Test the existing site panel layout and raw HTML behavior. Confirm the content trust boundary; a Markdown parser is not an HTML sanitizer.

**Exit gate:** no old duplicate libraries in bundles or print/network requests; smoke tests pass; malicious filenames and rendered content do not execute JavaScript.

**Bootstrap 3.4.1 is not the finish line.** Bootstrap 3 is unsupported, and current advisories also cover 3.4.1. Record any remaining exposure explicitly.

## 4. Migrate Dropbox and Ace independently

These are the highest data-loss risks. Do not combine them into one PR.

### Dropbox

Upgrade to the current supported SDK after reviewing each intervening breaking change.

The existing code assumes:

- Authentication methods live directly on the client.
- Authentication URL generation is synchronous.
- Response fields are directly accessible.
- Errors have the old SuperAgent structure.

Adapt those assumptions, preferably at the existing `DropboxRequest` boundary.

**Files:** `client/assets/js/Controller/OAuth.js`, `client/assets/js/Controller/FileExplorer.js`, `client/assets/js/Model/DropboxFile.js`, manifests and build script.

**Exit gate:** sign-in, restored sessions, listing, download, create, overwrite, expired authorization, and network failure all work. Failed saves must preserve editor contents and must not mark data saved.

Authentication-flow or token-storage changes require a separate approved decision, not a silent side effect of the SDK update.

### Ace

- Compare the custom fork with upstream and identify required changes.
- Prefer the maintained `ace-builds` distribution over compiling the old fork during every build.
- Preserve existing asset URLs, modes, themes, keyboard bindings, and completion behavior.
- Test collaboration specifically, including remote edits and prevention of rebroadcast loops.

**Files:** manifests, build script, `client/assets/js/Controller/Editor.js`, affected editor widgets, and `client/render.pl` only if asset discovery changes.

**Exit gate:** edit/save/reload round trips preserve content, all referenced Ace assets load, and two-browser collaboration passes.

Once no dependencies remain in Bower, remove `client/bower.json`, Bower itself, and its Docker installation/copy steps.

## 5. Finish unsupported UI dependencies

**Scope:** a separate compatibility migration, split by UI section.

- Move Bootstrap 3 to the maintained Bootstrap 5 line.
- Replace the old Bootstrap Material integration with existing CSS and native controls where practical.
- Migrate dialogs, menus, forms, site panels, utility classes, and icons in small reviewed sections.
- Keep jQuery for application code. Removing it wholesale is unnecessary.
- Consider jQuery 4 only after incompatible plugins are gone.
- Account for remaining vendored router, RSVP, localization, and other libraries. Each needs a pinned source and an explicit retain/update/replace decision.

Do not blindly rename `tether-shepherd` to `shepherd.js`. The current package has API and licensing changes. Removing an unused tour is preferable, subject to confirmation.

**Files:** relevant templates, `client/assets/js/Popup.js`, affected controllers, SCSS, manifests, and build script.

**Exit gate:** no unsupported Bootstrap/material stack; desktop/mobile screenshots, keyboard navigation, focus handling, and both app variants pass.

## 6. Prevent another backlog

Start this during phase 2; tighten gates as findings are cleared.

- Configure one dependency-update bot for weekly grouped patch/minor PRs and separate major upgrades.
- Add CI checks for clean installation, production builds, and browser smoke tests.
- Audit all npm dependencies, scan shipped assets for vendored libraries, and scan builder and final images separately.
- Block newly introduced high/critical findings initially. At completion, require no unresolved high/critical findings without an approved, expiring exception.
- Track lower-severity exploitable findings too. Severity alone must not determine priority.
- Review external scripts separately, including `client/public/sw.js`. npm cannot audit remotely loaded code.
- Use the existing beta route for each phase, then promote after verification. Roll back by image tag rather than rebuilding historical manifests.

**Files:** `.github/dependabot.yml` or equivalent, client workflows, and the smoke suite. Build/deploy changes require approval before implementation.

## Definition of done

The client installs from one enforced lockfile, builds on supported tooling, and ships no unidentified dependency copies. Unsupported libraries are removed or covered by explicit temporary exceptions. Every phase leaves a tested, releasable client.

**Start with phases 1–3. They deliver the fastest security improvement. Schedule phases 4–5 as separate migration work, but do not call Bootstrap 3.4.1 or jQuery 3.7.1 the permanent endpoint.**

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
