# DropRadar Status

## Phase
HEDY CONTRACT REMEDIATED — AUTHENTICATED DRY-RUN PENDING

## Current objective
Obtain an authenticated Hedy dry-run for the corrected manifest against the current `work` head, then deploy the validated immutable revision to dev, verify it, promote to staging, and collect deployed acceptance/rollback evidence. Production remains untouched.

## Remediation completed locally

- The Hedy manifest now declares durable data collections, six server functions, four same-origin API routes, a five-minute collection schedule, and a runtime Discord secret. It declares no writable filesystem persistence.
- Product browse/detail and health APIs run as Hedy request handlers. The static frontend's existing relative `/api/...` requests map to those same-origin routes.
- Scheduled authorized-import collection uses documented `ctx.data.query` and versioned compare-and-set writes, deterministic observation/alert ids, per-source isolation, bounded retries, source health, and structured logs.
- Watches use deterministic durable keys and conditional durable writes. Discord command logic is shared between the local reference server and Hedy handler.
- The local-only `JsonStore` now serializes actual cross-process saves. A child-process barrier regression test proves two independently loaded writers retain both writes.
- Thirty local tests pass, including parallel Hedy collector replay/deduplication, concurrent Hedy watch writes, manifest-to-route binding, and true child-process local-store concurrency.

## Evidence classification

### PASS — local/CI implementation evidence
- `npm test`: 30/30 PASS at runtime commit `d29699d`.
- `npm run check`: PASS.
- `python3 -m json.tool hedy.app.json`: PASS.
- GitHub Actions: both push and pull-request CI jobs PASS for the Hedy port and subsequent remediation commits.
- `git diff --check`: PASS before commit.

### PENDING AUTHENTICATED VALIDATION / DEPLOYED EVIDENCE
- Authenticated dry-run of the prior raw manifest failed because function/module entries lacked embedded `code`. A manually hydrated probe with lowercase indexes and recurring schedule kinds passed schema planning without warnings/errors. Runtime commit `d29699d` adds the deterministic self-contained build and remaining envelope/query/timer corrections; exact-head dry-run is pending.
- Hedy dev API behavior, durable collection semantics, schedule execution, logs, and forced source-failure behavior are not yet observed in deployment.
- Promotion of the remediated revision to staging, rollback/restore, and desktop/mobile staging smoke tests remain unverified.
- Live Discord receipt/delivery and authorized provider data require the founder-owned credentials/terms already batched in `FOUNDER_ACTIONS.md`.

No production deployment or modification was attempted.

## GitHub
- Repository: `morganrenovate-gif/Dropradar`
- Branch: `work`
- Pull request: https://github.com/morganrenovate-gif/Dropradar/pull/1
- GitHub remains the source of truth.

## Hedy environments
- Project: DropRadar (`proj_6e72d39b4f9a4f259ef00528c5b92b57`)
- Workspace slug: `morgan-projects`
- Dev: `dropradar--morgan-projects--dev.apps.hedyassist.com`
- Staging: `dropradar--morgan-projects--staging.apps.hedyassist.com`
- Production lifecycle status: Draft; production untouched.

## Founder action required
See `FOUNDER_ACTIONS.md`. Hedy control-plane access and founder-owned Discord/provider credentials are the remaining external dependencies; production authorization is neither requested nor implied.
