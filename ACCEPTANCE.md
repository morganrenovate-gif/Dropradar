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
