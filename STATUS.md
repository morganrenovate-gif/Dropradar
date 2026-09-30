# DropRadar Status

## Phase
HEDY DRY-RUN AND ISOLATED CORE RUNTIME PASS — MAIN DEV CREDENTIALS PENDING

## Current objective
Provision a scoped Hedy dev credential or Hedy CI/OIDC trust for the repository's manual dev workflow, run the exact candidate through `hedy app sync --environment dev`, verify the full Discord-enabled candidate in main-project dev, then promote the same immutable passing revision to staging. Production remains untouched.

## Repository implementation

- `hedy.app.source.json` is deterministically hydrated into the self-contained `hedy.app.json`; freshness is enforced by `npm run check:hedy`.
- The manifest declares eight durable collections, six functions, four same-origin routes, two recurring schedules, explicit function-module bindings, required Discord secrets, and the Discord outbound allowlist. It declares no writable file persistence.
- Collection and delivery use documented Hedy envelopes/queries and versioned compare-and-set writes with deterministic observation, alert, watch, and delivery identities.
- `.github/workflows/deploy-dev.yml` is manual and dev-only, requests GitHub OIDC, accepts an optional scoped `HEDY_TOKEN`, and runs on a Hedy CLI-equipped runner.
- `scripts/sync-hedy-dev.sh` preserves the scoped token path; otherwise it requires company/policy/audience configuration and successfully runs `hedy login --ci` before sync. It fails closed on incomplete OIDC configuration, failed login, or missing CLI, validates the generated manifest, and invokes exactly `hedy app sync --environment dev`; no staging or production sync path exists.
- The local JSON store remains reference/test-only and is not Hedy persistence.

## Authenticated Hedy evidence

### Exact PR head `66fca2dab0a40524429cb0ee6822a8eec463e5e1`
- GitHub Actions: PASS.
- Authenticated `hedy_app_sync(dryRun=true)`: **PASS / Planned**.
- Warnings: `[]`; errors: `[]`.
- Plan: filesAdded 1, filesChanged 2, routesChanged 4, bytesToUpload 6086.
- Immutable revision created but not deployed: `apprev_1790776598176_eb2c57b55ba548e8837560b6408d9649`.

### Isolated non-production Hedy validation sandbox
- Revision: `apprev_1790777237832_26134c032bfc43958b7d8b537978eebb`.
- Deployment: `appdep_1790777238993_6cbf9ac66ea04121bdacd2fad04bcc31`.
- `GET /`, `/api/health`, `/api/products?q=151`, and `/api/products/sv151-etb`: PASS/200.
- Recurring collection schedule instantiated; manual real execution completed in 625 ms.
- Empty provider lanes persisted as `UNCONFIGURED`; runtime logs captured `collection_complete`.
- A labeled sandbox-only synthetic observation persisted through real `ctx.data`, produced current/history state and one alert.
- Exact replay created zero additional observations/alerts.
- An older observation appended to history without regressing current state or creating an alert.
- The validation schedule was disabled after the test.

The sandbox deliberately omitted Discord route/delivery because founder-owned Discord secrets are not provisioned. Main DropRadar dev, staging, and production were unchanged by the sandbox validation.

## Current verification

- `npm test`: 37/37 PASS after completing token/OIDC dev-sync controls.
- `npm run build:hedy`: PASS and deterministic.
- `npm run check:hedy`: PASS.
- `npm run check`: PASS.
- `npm audit --omit=dev`: zero known vulnerabilities.
- GitHub Actions push and pull-request checks: PASS for dev-sync implementation commit `af9dea8`.
- Independent dev-sync QA: PASS with no open Critical/High/Medium findings.

## Remaining gates

1. **Founder-only credential action:** provision scoped `HEDY_TOKEN` in the GitHub `dev` environment, or configure Hedy CI/OIDC trust plus non-secret `HEDY_COMPANY_ID`, `HEDY_CI_TRUST_ID`, and `HEDY_OIDC_AUDIENCE` variables; ensure the selected self-hosted runner has the official Hedy CLI.
2. Run the manual `Deploy Hedy Dev` workflow, which stages static bytes before syncing dev.
3. Provision founder-owned Discord credentials and execute full main-dev Discord/provider acceptance.
4. Promote the same passing immutable revision to staging; run desktop/mobile smoke and full E2E.
5. Test rollback and restoration. Production promotion remains founder-controlled and was not attempted.

## GitHub / Hedy
- Repository: `morganrenovate-gif/Dropradar`
- Branch: `work`
- Pull request: https://github.com/morganrenovate-gif/Dropradar/pull/1 (draft)
- Main project: DropRadar (`proj_6e72d39b4f9a4f259ef00528c5b92b57`), workspace `morgan-projects`
- Production lifecycle status: Draft; production untouched.
