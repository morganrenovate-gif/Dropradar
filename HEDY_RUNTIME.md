# Hedy Runtime Contract and Validation Procedure

## Authoritative runtime shape

The authenticated Hedy control-plane review established the contract used by this candidate:

- `requiredSecrets` is an array of secret-name strings.
- Collection indexes are named `{name, field, sortField?}` objects, with at most four per collection.
- Function routes use `kind: "Function"` and `target`.
- Schedules use `functionName`, `cronExpression`, and IANA `timeZone`.
- Outbound hosts live at `capabilities.outboundHttp.allowedHosts`.
- Each server function is a sandbox script declaring `async function handler(ctx)` and returns `{status, headers, body}`.
- Shared code is a CommonJS-style Hedy module exposed through `ctx.modules.dropradar`; functions do not import files.
- Request, secrets, and HTTPS are accessed through `ctx.request`, `await ctx.secrets.get(name)`, and `ctx.http.fetch`.
- Durable operations use `ctx.data.get/getWithMeta/put/delete/list/query` and conditional `ifNotExists` / `ifVersion` writes. Hedy does not expose the transaction callback invented by the superseded implementation.
- Runtime logging uses `console.info/warn/error`.

## Deployable architecture

`hedy.app.source.json` is the reviewable source manifest. `npm run build:hedy` deterministically hydrates function/module source into the self-contained deploy artifact `hedy.app.json`, which declares public static assets, four same-origin API routes, six sandbox functions, two CommonJS modules (DropRadar domain logic and vendored TweetNaCl verification), eight durable collections, collection/delivery schedules, two secret names, and the Discord outbound allowlist. It declares no runtime-writable filesystem path.

The static client calls relative `/api/...` URLs, so the Hedy route mappings serve browser and API traffic from the same origin without CORS configuration.

## Concurrency and data integrity

The shared module uses deterministic item keys plus conditional writes:

- append-only observations and alert events use `ifNotExists`;
- current observations use `getWithMeta` plus `ifVersion` compare-and-set retries;
- stale observations remain history but cannot become current or alert;
- equal-time source conflicts are quarantined before current-state updates;
- delivery claims use versioned compare-and-set, bounded leases, and per-attempt fencing tokens;
- completion/failure only updates the claim still owned by that attempt;
- watch keys are deterministic (`userId:productId`).

The local `JsonStore` is a reference/test adapter only. It is absent from Hedy runtime paths and must not be used as dev or staging persistence.

## Validation state

Authenticated validation established embedded `code`, lowercase index identifiers, `kind: "recurring"`, `{items}` data envelopes, supported query options, per-function module declarations, and the absence of sandbox timers. Exact PR head `66fca2dab0a40524429cb0ee6822a8eec463e5e1` subsequently passed authenticated `hedy_app_sync(dryRun=true)` planning with warnings `[]` and errors `[]`. Manifest/schema acceptance is **PASS**; main-project dev deployment remains gated on CLI file staging and scoped authentication.

`npm run check:hedy` fails if the checked-in deploy artifact differs from a fresh deterministic build. Local tests execute the sandbox scripts as `handler(ctx)` and mock the documented Hedy surfaces, including named `query` indexes and versioned conditional writes. Local tests alone cannot prove acceptance; the authenticated exact-head dry-run now supplies that evidence. Discord Ed25519 verification is bundled as a pure-JavaScript CommonJS module and does not depend on an undocumented runtime crypto helper.

## Dev and staging procedure

1. Run `npm run check:hedy` against the checked-in self-contained `hedy.app.json`.
2. Provision scoped dev authentication and execute `./scripts/sync-hedy-dev.sh`, which stages static bytes and invokes the official CLI for **dev only**.
3. Retain the resulting immutable revision and deployment identifiers.
4. Confirm collection/index creation, then seed only authorized import records.
5. Provision founder-owned Discord secrets through Hedy secret storage.
6. Exercise health, product list/detail, unsigned Discord rejection, collection, delivery, source-failure isolation, and concurrent CAS behavior in dev; retain logs.
7. Promote the exact passing revision from dev to staging without editing staging directly.
8. Run desktop/mobile browser smoke tests and the full acceptance matrix.
9. Test rollback to the previous revision and restoration of the candidate; retain revision and request evidence.
10. Do not deploy or promote production without explicit founder authorization.

## Repository dev-sync path

Static manifest metadata is insufficient for deployment because Hedy requires file bytes to be staged in its content-addressed object store. The supported path is the official CLI command:

```bash
./scripts/sync-hedy-dev.sh
# validates the self-contained manifest, then executes exactly:
# hedy app sync --environment dev
```

The wrapper deliberately hard-codes `dev`, fails without either `HEDY_TOKEN` or GitHub Actions OIDC request variables, fails when the official `hedy` CLI is absent, and never accepts a staging/production environment argument.

The manual `.github/workflows/deploy-dev.yml` workflow:

- is `workflow_dispatch` only;
- has `contents: read` and `id-token: write` permissions;
- targets the protected GitHub `dev` environment;
- supports an environment-scoped `HEDY_TOKEN` or Hedy CI/OIDC authentication;
- uses a self-hosted `linux` runner labeled `hedy`, on which the official CLI must be provisioned outside source control;
- runs tests and manifest validation before the CLI stages files and syncs dev.

Staging and production remain promote-only; this repository intentionally defines no direct sync workflow for either environment.

## Authenticated validation evidence

The exact PR head `66fca2dab0a40524429cb0ee6822a8eec463e5e1` passed authenticated Hedy dry-run planning with no warnings or errors. Revision `apprev_1790776598176_eb2c57b55ba548e8837560b6408d9649` was stored but not deployed. A direct revision deployment correctly refused because static bytes had not been pre-staged, which is why the repository now uses the CLI sync path.

A separate, non-production validation project deployed a credential-free core profile from the same Git head. Its real Hedy runtime passed public routes, recurring schedule execution, durable current/history writes, replay deduplication, stale-observation handling, alert stability, health persistence, and runtime logging. Details and immutable IDs are recorded in `STATUS.md` and `QA_REPORT.md`. Main-project dev/staging/prod were not changed.
