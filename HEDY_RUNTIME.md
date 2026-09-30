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

Authenticated validation of the prior head found that raw function/module `sourcePath` entries were not deploy-time loaders and required embedded `code`. The same review established lowercase index identifiers, `kind: "recurring"`, `{items}` data envelopes, supported query options, per-function module declarations, and the absence of sandbox timers. An in-memory manually hydrated probe passed schema planning with no warnings/errors. The repository now reproduces that hydration deterministically, but the exact generated head has not yet received a new authenticated dry-run; acceptance remains **PENDING REVALIDATION**.

`npm run check:hedy` fails if the checked-in deploy artifact differs from a fresh deterministic build. Local tests execute the sandbox scripts as `handler(ctx)` and mock the documented Hedy surfaces, including named `query` indexes and versioned conditional writes. Local tests cannot prove Hedy accepts the manifest. Discord Ed25519 verification is bundled as a pure-JavaScript CommonJS module and does not depend on an undocumented runtime crypto helper.

## Dev and staging procedure

1. Run `npm run check:hedy` and submit the checked-in self-contained `hedy.app.json`.
2. Run authenticated `hedy_app_sync(dryRun=true)` against the exact reviewed Git commit and retain its response.
3. Repair any remaining schema/runtime validation error before deployment.
4. Build an immutable Hedy revision and deploy it to **dev** only.
5. Confirm collection/index creation, then seed only authorized import records.
6. Provision founder-owned Discord secrets through Hedy secret storage.
7. Exercise health, product list/detail, unsigned Discord rejection, collection, delivery, source-failure isolation, and concurrent CAS behavior in dev; retain logs.
8. Promote the exact passing revision from dev to staging without editing staging directly.
9. Run desktop/mobile browser smoke tests and the full acceptance matrix.
10. Test rollback to the previous revision and restoration of the candidate; retain revision and request evidence.
11. Do not deploy or promote production without explicit founder authorization.
