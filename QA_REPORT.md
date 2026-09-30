# Independent QA and Security Report

> Historical review note: this report records the review of revision `8dcd69a`. Engineering subsequently remediated the reported High lost-update interleaving, hidden import failures, missing provenance/timestamp validation, synthetic publication, and absent delivery primitive. Those changes require a fresh independent review; the original disposition below remains unaltered as durable evidence.

Date: 2026-09-30  
Reviewed revision: `8dcd69a`  
Result: **FAIL — remediation required**

## Executive finding

The local automated suite passes, but the implementation is not staging-ready. A High-severity cross-process lost-update defect can erase watches, observations, alerts, and source health. Required Discord delivery, credible source health, provenance enforcement, runtime scheduling, and deployable Hedy integration are also incomplete. Independent QA and adversarial signoff are withheld.

## High finding: whole-file store loses concurrent writes

`JsonStore` loads an entire JSON document and later replaces it without locking, version checking, or transactional merging. The long-lived API server and separate collector each retain independent in-memory copies. A save by either process can overwrite changes made by the other.

An adversarial two-instance test reproduced a persisted watch disappearing when a stale collector instance subsequently saved. Impact includes loss of persistent watchlists, observation history, source health, and pending alerts.

Required remediation: use concurrency-safe durable storage with transactional operations, then test interleaved API and collector writes across processes.

## Additional failures

1. Missing or malformed import files are silently converted to empty adapters and reported `HEALTHY` with zero items. Failures are therefore not diagnosable and source health can be falsely green.
2. Import provenance is not validated. Missing source item IDs become the literal string `undefined`; empty evidence, absent locators, future timestamps, and synthetic evidence are accepted.
3. Timestamp-free imports receive collection time, so replaying the identical input at a later time creates duplicate historical observations.
4. Synthetic evidence can enter public current/history responses and generate alerts despite the compliance register requiring its exclusion outside tests.
5. Alert records are created, but there is no delivery worker or Discord delivery implementation; `deliveredTo` remains empty.
6. The Hedy manifest declares no functions, routes, schedules, webhooks, durable collections, runtime writable paths, secrets, or environment. It also describes the prior static shell and omits the new application JavaScript. The implemented Node application therefore lacks a demonstrated Hedy deployment path.
7. The web watch CTA links to the generic Discord homepage rather than a functioning bot invite or watch flow.
8. The default three import lanes contain no observations; a clean collection reports all three as healthy while collecting zero records.
9. Desktop/mobile browser E2E, staging, rollback, and deployed Discord evidence are absent.

## Lower-severity concerns

- Product browse responses embed history for every result and historical storage is unbounded, enabling payload and storage growth.
- Security response headers such as CSP and `X-Content-Type-Options` are absent.
- No lockfile exists, so `npm audit --omit=dev` cannot run. There are currently no declared third-party dependencies.

## Passing local evidence

- `npm test`: 11/11 tests passed.
- `npm run check`: passed.
- Catalog contains 30 products with 30 unique internal IDs and 30 unique UPCs.
- Existing tests demonstrate inventory normalization, fail-closed mapping, bounded retry, per-source failure isolation, single-process replay alert suppression, watch/unwatch behavior, unsigned Discord rejection, and closed unknown routes.
- User-visible Discord value output and web copy distinguish observed asking/offer prices from completed sales.

## Commands executed

```text
git status --short --branch
find . -maxdepth 3 -type f -not -path './.git/*' | sort
git log --oneline -8
npm test
npm run check
tmp=$(mktemp -d); DATA_FILE=$tmp/db.json node src/collect.js
node -e "const p=require('./data/products.json'); console.log(p.length,new Set(p.map(x=>x.id)).size,new Set(p.map(x=>x.upc)).size)"
npm audit --omit=dev
```

Custom Node adversarial checks additionally exercised two-store interleaving, timestamp-free replay, absent source IDs, empty evidence, future timestamps, unsafe source locators, and synthetic evidence publication.

## Acceptance disposition

- Local unit/integration suite: **PASS**
- Independent QA: **FAIL**
- Independent adversarial review: **FAIL**
- No open Critical findings: **PASS based on reviewed local surface**
- No open High findings: **FAIL**
- Staging end-to-end acceptance: **BLOCKED / NOT RUN**
- Founder review gate: **NOT MET**

## Remediation verification — 2026-09-30 (`6d25170`)

Result: **FAIL — High data-integrity finding remains open.** Local automated tests pass, but local independent QA and the `No High security findings remain open` criterion do not pass.

### Verified improvements

- `npm test` passes 13/13 tests and `npm run check` passes.
- Missing import files now produce independently observable `DEGRADED` source states with bounded retry audit records instead of false `HEALTHY` states.
- Runtime observations now require a source, source item ID, timestamp, and evidence object.
- Synthetic adapters are rejected from runtime collection unless test mode is explicitly enabled.
- The specific sequential collector-save case covered by the new test preserves a watch already saved by the API process.

### High finding still reproducible

The merge-on-save change does not provide concurrency control and allows stale in-memory values to overwrite newer durable state:

1. A server loaded an old current observation.
2. A collector loaded the same file, wrote a newer observation/current value, and saved.
3. The stale server added a watch and saved.
4. The persisted `current` value regressed from the newer observation to the old observation because the stale server-side map takes precedence over disk state.

A second sequential replica test also reproduced watch loss: two server-like stores loaded the same state; replica 1 added and saved `u1`; replica 2 added and saved `u2`; the final file retained `u2` but lost `u1`. Simultaneous read/modify/write remains unsafe as well because there is no lock, compare-and-swap, transaction, or single-writer boundary.

Consequently, observations may remain in append-only history while public `current` data regresses, and watches can still be destroyed in multi-instance/interleaved operation. Merge precedence also permits stale source health or alert delivery state to overwrite newer values.

Required remediation remains concurrency-safe durable storage with transactional updates (preferred), or a rigorously tested locking/version-conflict design covering all writers and all domains. Tests must include stale API save after a collector update, multiple stale API writers, current/source-health monotonicity, and alert-delivery state.

### Remaining adversarial concerns

- Evidence validation accepts an empty object and does not enforce the documented evidence kind, source locator, or freshness constraints.
- Future timestamps remain accepted.
- `deliverPendingAlerts` is not integrated with a Discord sender or runtime worker. A send failure after earlier successful sends aborts before saving delivery markers, so retry could duplicate those already-successful deliveries.
- Hedy/staging deployment, scheduling, persistent runtime storage, Discord webhook/delivery, browser E2E, and rollback evidence remain separate external or implementation gaps.

### Verification commands

```text
git show --stat --oneline 6d25170
git show --format=fuller --no-ext-diff 6d25170 -- src/store.js src/core.js src/monitor.js src/collect.js src/server.js test hedy.app.json static/app.js
npm test
npm run check
tmp=$(mktemp -d); DATA_FILE=$tmp/db.json node src/collect.js; cat $tmp/db.json
node --input-type=module # stale server/current regression and stale replica/watch-loss adversarial script
```

### Updated disposition

- Local automated unit/integration suite: **PASS (13/13)**
- Missing-source degraded health remediation: **PASS**
- Required provenance presence checks: **PARTIAL PASS**
- Synthetic runtime exclusion: **PASS for adapter-level guard**
- Original data-integrity High: **FAIL — remains open**
- No open High findings: **FAIL**
- Independent local QA: **FAIL**
- Staging/deployed acceptance: **NOT RUN / distinct external gap**

---

## Fresh independent adversarial review — 2026-09-30

### Candidate
- Final reviewed commit: `655ae77`
- Reviewer role: independent QA / Security agent; reviewer made no repository changes.
- Local disposition: **PASS — no open Critical or High findings.**
- Deployed Hedy disposition: **BLOCKED-EXTERNAL / NOT VERIFIED.** Local signoff is not staging acceptance.

### Remediation history and closure evidence

The first review of `d63055e` failed with two High findings: stale/out-of-order observations could create false alerts, and watcher alert delivery was absent. Remediation added winner-only alert derivation, equal-time conflict quarantine, durable delivery records, a scheduled Discord delivery worker, runtime bot-token handling, and concurrency/failure tests.

A re-review of `1215237` found one remaining High: a fixed oldest-alert page could starve later delivery work, and expired delivery leases lacked an ownership fence. Commits `ebb912e` and `655ae77` changed the worker to query indexed `PENDING`/expired `SENDING` delivery records and added unique per-attempt claim tokens checked by completion/failure transitions.

The final reviewer independently verified:

- stale observations append to history but neither regress current state nor create false alerts;
- equal-time conflicting source observations are quarantined;
- 201-record backlog probe with 100 already `SENT` and 101 `PENDING` sent exactly 101 unique remaining deliveries across three worker runs;
- late completion and late failure from an expired worker cannot overwrite the newer fenced claim;
- immediate parallel delivery workers claim once and delivery failures return to retryable state;
- Hedy manifest delivery indexes match the worker's `status`, `updatedAt`, and `leaseUntil` queries;
- true separate-process JSON-store concurrency and terminated-owner lock recovery pass;
- empty authorized lanes report `UNCONFIGURED`, malformed rows are quarantined, future observations/missing evidence kinds are rejected, and the full syntax check covers runtime/test JavaScript.

### Independent commands and results

- `npm test`: **PASS, 27/27**.
- `npm run check`: **PASS**.
- `npm audit --omit=dev`: **PASS, zero known vulnerabilities**.
- `python3 -m json.tool hedy.app.json`: **PASS**.
- `git diff --check`: **PASS**.
- Targeted 201-delivery backlog probe: **PASS**.
- Targeted expired-lease stale completion/failure probes: **PASS**.

### Residual non-High risks

- Discord delivery is necessarily at-least-once across the boundary where Discord accepts a message but durable completion fails. A send exceeding the 60-second lease can duplicate externally even though claim fencing preserves durable state integrity. Monitor send latency and duplicate rate before scale.
- Delivery fan-out is capped at 1,000 watchers per product for the MVP.
- Removing a watch after an alert transaction has already created a `PENDING` delivery does not cancel that already-enqueued delivery.

### External evidence boundary

The independent local PASS does **not** verify Hedy manifest acceptance, real `ctx.data` signatures/isolation/index behavior, deployed dev routes, static-to-API integration, scheduled execution, runtime logs, forced source-failure behavior, live Discord delivery, dev-to-staging promotion, desktop/mobile staging smoke behavior, or rollback/restore. Those items remain `BLOCKED-EXTERNAL` until authenticated Hedy access and founder-owned Discord/provider credentials are available. Production was not touched.

---

## Authoritative Hedy contract remediation review — 2026-09-30

### Candidate and disposition
- Reviewed runtime commit: `48de6b2`
- Independent local disposition: **PASS for submission to authenticated Hedy dry-run**.
- Open scoped Critical/High/Medium findings: **none**.
- Authenticated dry-run of this corrected commit: **NOT YET RUN / PENDING VALIDATION**.

### Authoritative corrections verified

The reviewer verified that the candidate now follows the authenticated control-plane contract: string secret names; named object indexes with no more than four per collection; `capabilities.outboundHttp.allowedHosts`; `kind: "Function"`/`target` routes; real schedule fields; plain `async function handler(ctx)` scripts; CommonJS Hedy modules; `ctx.request`; `ctx.secrets.get`; `ctx.http.fetch`; console logging; and `ctx.data` reads, named queries, deterministic keys, `ifNotExists`, and `getWithMeta`/`ifVersion` compare-and-set. No ESM import, runtime require, Buffer, global fetch, invented transaction callback, `tx.create`, `ctx.log`, or direct secret property access remains in Hedy sandbox code.

### High-severity closure probes

1. **Discord verification:** the handler no longer depends on undocumented `ctx.crypto`. A vendored, licensed, pure-JavaScript TweetNaCl CommonJS module verifies Ed25519 signatures. Sandbox tests accept a valid signed Discord ping and reject an invalid signature.
2. **CAS winner isolation:** compare-and-set returns the previous/current outcome only after a conditional put succeeds. An injected interleaving test installs a newer current record during the first failed write and proves the losing stale observation cannot create an alert.
3. **Alert/delivery recovery:** delivery reconciliation runs for both newly inserted and already durable deterministic alerts. An interruption after alert insertion followed by replay restores the missing delivery record.

### Independent checks
- `npm test`: **PASS, 29/29**.
- `npm run check`: **PASS**, including `.js` and `.cjs` sandbox sources.
- `python3 -m json.tool hedy.app.json`: **PASS**.
- `git diff --check`: **PASS**.

### Evidence boundary

This review establishes local readiness to submit the manifest for authenticated `hedy_app_sync(dryRun=true)`. It does not claim that Hedy accepted the corrected manifest. Actual dry-run acceptance, revision creation, dev behavior, schedules/logs, Discord integration, staging promotion, browser smoke tests, and rollback/restore remain pending. Production was not touched.

---

## Self-contained deploy-manifest review — 2026-09-30

### Candidate and disposition
- Reviewed runtime commit: `d29699d`
- Independent local disposition: **PASS for exact-head authenticated dry-run submission**.
- Open scoped Critical/High/Medium findings: **none**.
- Authenticated dry-run of this exact generated manifest: **NOT YET RUN / PENDING VALIDATION**.

### Authenticated-review items verified locally

- `hedy.app.json` embeds `code` for every function and module and contains no function/module `sourcePath`; `hedy.app.source.json` remains the reviewable source map.
- Each function declares exactly the Hedy modules it consumes.
- `npm run build:hedy` is deterministic, and `npm run check:hedy` fails when the checked-in artifact differs byte-for-byte from a fresh build.
- All index identifiers are lowercase/hyphenated and every recurring schedule declares `kind: "recurring"`.
- Data mocks and runtime code use `{items, cursor}` list/query envelopes.
- Runtime queries use only documented `eq`, `order`, and `limit`; the mock rejects options outside `eq/prefix/between/order/limit/cursor`.
- Expired `SENDING` leases are queried by status/order and filtered by `leaseUntil` in application code; history uses `order: "desc"`.
- The Hedy sandbox contains no timers, ESM imports, runtime `require`, `Buffer`, global `fetch`, or invented transaction API.
- Health collection correctly unwraps the `.items` envelope.
- Prior CAS conflict, interruption/replay recovery, deterministic identity, Ed25519 verification, and delivery-fencing tests continue to pass.

### Independent checks
- `npm test`: **PASS, 30/30**.
- `npm run check`: **PASS**, including deterministic manifest freshness and all `.js`/`.cjs` syntax checks.
- `npm audit --omit=dev`: **PASS, zero known vulnerabilities**.
- `python3 -m json.tool hedy.app.json`: **PASS**.
- Rebuilding twice preserved the identical deploy-manifest hash and produced no Git diff.
- Targeted health-envelope and embedded-code/module-declaration probes: **PASS**.

### Evidence boundary

The exact Git artifact is ready to submit to authenticated `hedy_app_sync(dryRun=true)`. This QA pass is not control-plane acceptance. Dry-run success, dev deployment, runtime behavior, staging promotion, browser smoke tests, and rollback/restore remain pending. Production was not touched.
