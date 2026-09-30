# DropRadar Status

## Phase
MAIN DEV FULL DISCORD E2E PASS — LIVE PROVIDER / STAGING GATES PENDING

## Current objective
Preserve the passing main-dev candidate, finish provider-compliance decisions and authorized live-source onboarding, then promote the same immutable candidate to staging after staging-scoped Discord secrets are provisioned. Production remains untouched and founder-controlled.

## Repository implementation

- `hedy.app.source.json` deterministically hydrates the self-contained `hedy.app.json`; freshness is enforced by `npm run check:hedy`.
- The candidate declares eight durable collections, six runtime functions, four product/API routes, two recurring schedules, required Discord secrets, and an outbound allowlist for Discord.
- Collection/delivery use documented Hedy envelopes, named indexes, deterministic identities, compare-and-set writes, lease fencing, and replay-safe alert creation.
- `.github/workflows/deploy-dev.yml` and `scripts/sync-hedy-dev.sh` retain the validated optional scoped-token/OIDC dev-only path. That CI path is no longer a blocker for the current build because Hedy native revision copy carried exact static file objects into the main project without a runner.
- GitHub remains the source of truth. Hedy is the runtime/control plane.

## Main-project dev evidence

### Exact source candidate
- Git commit: `4fb8b9d01bedd547004fed689a3861d3a6507e77`.
- Immutable full candidate in main DropRadar: `apprev_1790782743529_189bbfa11b2b45a99d7248e57d04df36`.
- Source provenance remains Git-backed to branch `work` / commit `4fb8b9d...`.
- Static file bytes were carried into the main project via Hedy native revision copy; no local runner was required.

### Full Discord-enabled dev acceptance
- Discord application configured and verified against `/api/discord`.
- `DISCORD_BOT_TOKEN` and `DISCORD_PUBLIC_KEY` are stored only in Hedy dev secret storage.
- Global commands registered: `/watch`, `/unwatch`, `/value`.
- Real Discord interaction tests:
  - `/watch 151 Elite Trainer Box`: PASS; durable watch row created.
  - `/value 151 Elite Trainer Box`: PASS; returned the expected no-observation state.
  - `/unwatch 151 Elite Trainer Box`: PASS; durable watch row removed.
- Unsigned interaction request rejection: PASS / 401.
- Main dev UI/API smoke: `/`, `/api/health`, `/api/products?q=151`, and product detail all PASS / 200.

### Scheduled alert delivery proof
- A clearly labeled synthetic dev-only observation was used solely for acceptance.
- Collector schedule produced a normalized observation, alert event, and pending Discord delivery.
- One initial manual delivery run wedged in the Hedy run ledger and was force-stopped. The delivery function itself passed directly, and the next fresh scheduled delivery run completed in 862 ms with `claimed=1 sent=1 failed=0`.
- Discord API was queried afterward and confirmed the DropRadar bot messages actually existed in the DM channel.
- Synthetic import / observation / current / alert / delivery / watch state was removed after testing.
- Best Buy synthetic health state was removed; no synthetic price remains in public product state.
- Both recurring dev schedules were disabled again after acceptance.
- The temporary dev diagnostic route is inert and returns 404.

## Current dev lane
- Active dev revision contains the passing candidate plus one inert dev-only diagnostic function/route returning 404. The immutable exact source candidate remains preserved separately as `apprev_1790782743529_189bbfa11b2b45a99d7248e57d04df36`.
- Production is Draft and untouched.
- Staging remains on the earlier bootstrap revision and has not been promoted.

## Current verification

- Repository tests: 37/37 PASS at PR head `4fb8b9d...`.
- Build/check/audit/JSON/diff checks: PASS.
- GitHub Actions CI on exact PR head: PASS.
- Independent OIDC adversarial QA: PASS.
- Main-project Hedy dev UI/API runtime: PASS.
- Discord signed interaction verification: PASS.
- Discord command persistence/query/removal: PASS.
- Alert generation: PASS.
- Scheduled Discord delivery: PASS on fresh run.
- Actual Discord message existence: PASS.
- Synthetic cleanup: PASS.

## Remaining gates

1. **Provider compliance + credentials:** choose production-safe live source terms and provision authorized source credentials/feeds. Best Buy API terms require source attribution and limit caching of API content to 72 hours, so historical retention must be handled source-specifically rather than assuming unrestricted storage.
2. **Staging Discord secrets:** provision the bot token/public key into staging because Hedy project secrets are environment-isolated.
3. Promote the exact immutable passing candidate to staging, point the Discord interaction endpoint at staging for acceptance, and rerun Discord/UI/API E2E.
4. Test staging rollback and restoration.
5. Resolve the long-term GitHub-hosted deployment automation path before relying on CI for unattended deployments.
6. Production promotion remains an explicit founder-controlled action and has not been attempted.

## GitHub / Hedy
- Repository: `morganrenovate-gif/Dropradar`
- Branch: `work`
- Pull request: https://github.com/morganrenovate-gif/Dropradar/pull/1 (draft)
- Main project: DropRadar (`proj_6e72d39b4f9a4f259ef00528c5b92b57`), workspace `morgan-projects`
- Dev host: `dropradar--morgan-projects--dev.apps.hedyassist.com`
- Production lifecycle status: Draft; production untouched.
