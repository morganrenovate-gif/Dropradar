# DropRadar Decisions

## D-001 — GitHub is source of truth
Status: Accepted

GitHub stores application source and durable project contracts.

## D-002 — Hedy-first MVP runtime
Status: Accepted

Use Hedy initially for hosted app runtime, app data, scheduled/background jobs, secrets, logs, dev/staging/prod, test requests, promotion and rollback.

Add external infrastructure only when measured requirements justify it.

## D-003 — Promotion lanes
Status: Accepted

Builders operate in branches/sandbox/dev.
Staging is promote-only.
Production is founder-controlled.

## D-004 — Compliant source access
Status: Accepted

Use official, affiliate, licensed or otherwise permitted source access. Do not evade technical or contractual controls.

## D-005 — Evidence before claims
Status: Accepted

Preserve timestamped source observations and provenance. Derived intelligence must remain distinguishable from raw observations.

## D-006 — Zero-dependency Node.js reference runtime
Status: Accepted

Use Node.js 22 platform APIs for the MVP reference service and tests. This keeps local and CI execution deterministic, avoids an unnecessary dependency supply chain, and remains reversible when the Hedy server-function contract is confirmed.

## D-007 — Append-only local reference store
Status: Accepted

Use atomic JSON-file replacement for the local/dev reference data store. Observation records are append-only and current state is a derived index. This is not claimed as the Hedy staging persistence layer; promotion remains blocked until the corresponding Hedy data collections or runtime writable storage can be configured and exercised.

## D-008 — Authorized import source substitutes
Status: Accepted

Support reviewed Pokémon catalog, eBay-authorized, and Best Buy-authorized imports as compliant source substitutes without scraping storefronts. Imports remain `UNKNOWN` unless the authorized evidence explicitly provides inventory, retain source identity, and cannot be confused with synthetic test observations.

## D-009 — Hedy durable functions are the deployment runtime
Status: Accepted

The deployable application uses Hedy server functions, same-origin routes, scheduled collection, secrets, logs, and `ctx.data` durable collections. Concurrency uses deterministic identifiers plus Hedy conditional writes: `ifNotExists` for append-only records and `getWithMeta`/`ifVersion` compare-and-set for mutable current and delivery state. The JSON file store remains a local reference/test adapter only, is not declared as a runtime-writable path, and is not staging persistence.

## D-010 — Deterministic self-contained Hedy deploy manifest
Status: Accepted

Maintain `hedy.app.source.json` as the reviewable source-path manifest and generate the deployable `hedy.app.json` with `npm run build:hedy`. The generated artifact embeds every function/module `code` payload and each function's explicit module dependencies. `npm run check:hedy` compares the committed artifact byte-for-byte with a fresh build so authenticated validation can submit the exact Git content without manual hydration.
