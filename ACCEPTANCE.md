# DropRadar MVP Acceptance Contract

Founder review may be requested only when every Required criterion is PASS or explicitly marked BLOCKED-EXTERNAL with evidence that all independent work is complete.

## Required: product and data
- [ ] At least 30 canonical Pokemon products are loaded.
- [ ] Canonical identifiers and retailer/source identifiers are separated.
- [ ] At least 3 permitted real data sources operate, or a source is replaced by a documented compliant substitute.
- [ ] Synthetic source adapters exist for deterministic testing.
- [ ] Observations are timestamped and historical observations are preserved.
- [ ] Inventory state normalization works.
- [ ] Price observations preserve source attribution.
- [ ] Uncertain product mappings fail safely.

## Required: monitoring
- [ ] Scheduled/background collection executes without a founder present.
- [ ] One source failure does not terminate unrelated source collection.
- [ ] Retries are bounded and observable.
- [ ] State-change detection works.
- [ ] Duplicate alert suppression works.
- [ ] Replayed jobs do not create duplicate user-visible alerts.
- [ ] Source health is observable.

## Required: Discord
- [ ] Discord bot can receive commands.
- [ ] `/watch` persists a watch.
- [ ] `/unwatch` removes a watch.
- [ ] `/value` returns source-attributed current information.
- [ ] Watchers receive relevant alerts.
- [ ] Duplicate alerts are suppressed.

## Required: web
- [ ] Public web interface deploys.
- [ ] Product browsing/search works.
- [ ] Product detail page works.
- [ ] Current source observations are visible.
- [ ] Recent observation history is visible.
- [ ] Provenance/source labels are visible.
- [ ] Watch CTA has a functioning path.
- [ ] Desktop smoke test passes.
- [ ] Mobile smoke test passes.

## Required: governance / safety
- [ ] No secret is committed to GitHub.
- [ ] Secrets are provisioned through Hedy secret management or equivalent secure runtime storage.
- [ ] Outbound hosts are explicitly allowlisted.
- [ ] No Critical security findings remain open.
- [ ] No High security findings remain open.
- [ ] Retail/source access complies with documented provider constraints.
- [ ] Asking prices are not represented as completed sales.
- [ ] Staging is promotion-only.
- [ ] Production is not released by autonomous agents.

## Required: operations
- [ ] Runtime logs are available.
- [ ] Failed source calls are diagnosable.
- [ ] Rollback path is tested.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] End-to-end staging tests pass.
- [ ] Independent QA signs off.
- [ ] Independent adversarial review signs off.

## Founder interruption
Founder review should contain:
- staging URL;
- test summary;
- known limitations;
- current monthly infrastructure estimate;
- any remaining identity/legal/credential actions;
- release recommendation as facts and risks, not a forced production action.

---

## Candidate evidence audit — 2026-09-30

Status terms: **LOCAL-PASS** means automated implementation evidence exists but does not satisfy the contract's deployed definition of real; **BLOCKED-EXTERNAL** means all currently available independent implementation work is complete and Hedy/credential access is required; **FAIL** means an independently actionable defect remains.

### Product and data
- 30 canonical products, separated canonical/source identifiers, normalization, provenance, fail-closed mapping, synthetic fixtures, and append-only history: **LOCAL-PASS** (`data/products.json`, `test/core.test.js`, `test/monitor.test.js`).
- Three compliant authorized-import substitutes: **LOCAL-PASS** as implemented lanes; **BLOCKED-EXTERNAL** for live authorized inputs/credentials (`SOURCE_COMPLIANCE.md`, `FOUNDER_ACTIONS.md`).
- Hedy durable history/current-state collections and versioned conditional writes: **LOCAL-PASS** contract tests; **BLOCKED-EXTERNAL** for deployed data-plane proof (`hedy/modules/dropradar.cjs`, `test/hedy.test.js`).

### Monitoring
- Scheduled collection declaration, bounded retries, per-source isolation, deterministic replay suppression, source health, and structured logging: **LOCAL-PASS** (`hedy.app.json`, `hedy/functions/collect.js`, `hedy/modules/dropradar.cjs`, `test/hedy.test.js`).
- Actual unattended schedule execution and deployed logs/source-failure evidence: **BLOCKED-EXTERNAL** pending authenticated Hedy deployment.

### Discord
- Signed request validation, `/watch`, `/unwatch`, `/value`, durable watch keys, versioned CAS delivery claims with fenced leases, backlog draining, failure retries, and alert deduplication paths: **LOCAL-PASS** (`hedy/functions/discord.js`, `src/discord.js`, `test/server.test.js`, `test/hedy.test.js`).
- Actual Discord command receipt and alert delivery: **BLOCKED-EXTERNAL** pending founder-owned Discord application credentials and Hedy secret provisioning.

### Web
- Manifest-bound same-origin product list/detail/health routes plus responsive browse/detail/provenance UI: **LOCAL-PASS** (`hedy.app.json`, `static/app.js`, `test/manifest.test.js`, `test/hedy.test.js`).
- Hedy dev/staging route proof and desktop/mobile staging smoke tests: **BLOCKED-EXTERNAL** pending authenticated Hedy access and a reachable Hedy host.

### Governance and safety
- Secret scanning, runtime secret declaration, server-only collections, no staging JSON filesystem, compliant source policy, asking-price language, and production prohibition: **LOCAL-PASS** (`.github/workflows/ci.yml`, `hedy.app.json`, `SOURCE_COMPLIANCE.md`, `HEDY_RUNTIME.md`).
- Hedy secret provisioning: **BLOCKED-EXTERNAL** pending founder-owned credential creation.
- Critical/High finding closure and independent local QA: **LOCAL-PASS** at runtime commit `d29699d` for exact-head authenticated dry-run submission; actual dry-run and deployed adversarial QA remain pending (`QA_REPORT.md`).

### Operations
- Unit/integration/CAS/concurrent-process tests and CI: **LOCAL-PASS** (30/30 tests; two GitHub Actions jobs passed for the prior candidate; CI for the corrected candidate is pending).
- Hedy logs, dev-to-staging promotion, end-to-end staging, rollback/restore, and deployed adversarial QA: **BLOCKED-EXTERNAL** pending successful authenticated dry-run and Hedy deployment.

### Current release gate
The candidate is **not staging-accepted and not ready for production**. No criterion requiring deployed behavior is marked complete from local code alone. The exact remaining deployment procedure and evidence requirements are in `HEDY_RUNTIME.md`.
