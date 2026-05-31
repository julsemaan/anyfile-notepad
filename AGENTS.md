# AGENTS.md

## Purpose
- Repo playbook for coding agents.
- Optimize for small, local, reversible changes.
- If repo convention unclear, stop and ask user before choosing.

## Core working rules
- Follow style already present in file. Repo is intentionally mixed/legacy; do not normalize casing or formatting across files.
- Keep refactors narrow. No broad framework rewrites, folder moves, or cleanup passes unless user asks.
- Ask first before changing:
  - public API shapes or collection names
  - auth behavior or env var names
  - build/deploy workflows
  - subscription / paid-access behavior
  - generated/vendor files
- Never commit real secrets or local-only config.
- For touched Go files, run `gofmt` if needed.

## Repo map
- `client/` — legacy browser app. Plain JS + jQuery + Handlebars + TT templates + SCSS. Built by bash/perl pipeline, not modern bundler.
- `webserver/` — Go HTTP server. Serves app assets, OAuth2 callbacks, Stripe billing, long-poll collaboration, subscription gating.
- `api/` — Go REST data service for `mime_types`, `extensions`, `syntaxes`, `settings`, `contact_requests`. Prometheus metrics on separate listener.
- `admin/` — static AngularJS CRUD UI for API resources.
- `pages/` — markdown content for marketing/help/legal pages.
- `utils/` — shared Go email helper module.
- `docker4dev/` — local multi-container dev stack.
- `.github/workflows/` — per-component image builds + Go coverage workflow.
- `script/` — legacy deployment/util scripts.
- `visuals/` — marketing/art assets.
- `julsemaan-tmp/` — scratch area; ignore unless user explicitly wants it.

## Critical repo caveats
- Client build script is in 2 places but is a symlink:
  - client/afn-app.sh
  - ./afn-app.sh
- Client build downloads resource JSON from live API URLs into `client/tmp/cache/`:
  - `extensions.json`
  - `syntaxes.json`
  - `mime_types.json`
  Local API/schema changes do **not** automatically feed client build output.
- `api/go.mod` and `webserver/go.mod` point to published `utils` pseudo-versions by default. Local `utils/` edits will not affect those modules unless you temporarily use commented `replace => ../utils` lines. Do not commit accidental `replace` changes unless intended.
- `client/assets/js/VARS.js.example` is stale relative to current runtime usage. Inspect `AFN_VARS` call sites before adding/removing config keys.
- Webserver serves 2 app variants:
  - `/app.html` — normal
  - `/app-plus-plus.html` — paid / no-ads
  Subscription/session logic in `webserver/http_handler.go` rewrites between them.
- API auth is asymmetric by design:
  - GETs are open
  - `POST /contact_requests` is open
  - `/stats` is open
  - other writes expect Basic auth
  If auth rules change, update `admin/` and API tests together.

## Files and paths to avoid editing by default
- `client/node_modules/`
- `client/bower_components/`
- `client/output/`
- `client/tmp/`
- `client/dist/`
- `client/fully-static/`
- `client/assets/js/VARS.js`
- `admin/js/VARS.js`
- `docker4dev/.env`
- `api/db/`
- Anything under scratch/tmp dirs unless task explicitly targets generated output

## Local dev + build commands
- Full dev stack:
  - `cd docker4dev && docker compose up --build`
- Local ports in dev stack:
  - app/webserver: `http://localhost:8000`
  - API: `http://localhost:8001`
  - admin: `http://localhost:8002`
  - API metrics: `http://localhost:8003/metrics`
- Root build/test helpers:
  - `make go-test-all`
  - `make go-coverage-all`
  - `make client/dist`
  - `make client/fully-static`
  - `make clean`
- Module-local:
  - `cd api && make api`
  - `cd webserver && make webserver`
  - `cd client && make extract-i18n-strings`

## Validation policy
- Prefer smallest relevant validation, not full-repo runs.
- If `webserver/` changed: run `cd webserver && go test ./...`
- If `api/` changed: run `cd api && go test ./... -mod=mod`
- If `utils/` changed: run `cd utils && go test ./...`
- If shared Go behavior changed across modules: run `make go-test-all`
- If client locale/i18n strings changed: run `cd client && make extract-i18n-strings`
- `admin/`, `pages/`, and most client JS have no real automated test harness here. Do smallest practical smoke validation and clearly state gaps.

## Change map by area
- API resource/schema changes usually require coordinated edits in:
  - `api/internal/resources/`
  - `admin/js/services.js`, controllers, partials
  - client code consuming generated JSON/resources
- OAuth/config changes usually require coordinated edits in:
  - `client/assets/js/Controller/OAuth.js`
  - `client/assets/js/VARS.js` usage
  - `webserver/oauth2_handlers.go`
  - local env / CI secret injection
- Subscription/paywall changes usually require coordinated edits in:
  - `webserver/subscriptions.go`
  - `webserver/billing_handlers.go`
  - `webserver/http_handler.go`
  - client upgrade/subscription templates
- Client build/pipeline changes usually require coordinated edits in:
  - root `afn-app.sh`
  - `client/afn-app.sh`
  - `client/render.pl`
  - relevant Dockerfiles / workflow files

## Style guidance by subsystem
- Go (`api/`, `webserver/`, `utils/`): keep changes idiomatic and small; preserve package structure and existing test style.
- Client JS: preserve old-school prototype/global constructor style already in file. Do not modernize to modules/classes unless asked.
- Admin JS: preserve AngularJS 1.x patterns and existing CRUD factory/controller structure.
- Templates/SCSS/markdown: keep surrounding formatting and naming patterns.
- Repo owner note in `CONTRIBUTING.md` still applies: style is inconsistent; match local file, not imaginary repo-wide standard.

## Secrets and config
- Never print, commit, or hardcode real values from local config.
- Treat these as local-only/secret-bearing:
  - `client/assets/js/VARS.js`
  - `admin/js/VARS.js`
  - `docker4dev/.env`
- CI injects client/admin runtime config from GitHub secrets in workflow files.
- If task needs new config, prefer example files, docs, or env-variable plumbing over checked-in secrets.

## CI / deploy notes
- Workflows are path-scoped per component.
- Deployment branch logic is not uniform:
  - client workflow has special `master` vs `beta` behavior
  - API has `staging` / `production` deploy behavior
  - admin/pages/webserver promote from `master` via k8s PR flow
- Read matching workflow file before changing release logic.
- Root `deploy` target looks legacy/infra-specific; do not rely on it unless user asks.

## Ask-user triggers
- Unsure whether to edit source vs generated copy
- Need to change schema/env/auth/build/deploy behavior
- Need to touch secret-bearing files
- Need to choose between local `utils/` replace vs published module version
- Validation would require heavy Docker/image/deploy operations
