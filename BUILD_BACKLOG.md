# DropRadar MVP Build Backlog and Acceptance Traceability

This document turns the acceptance contract into bounded delivery slices. It is
not evidence that a capability passes. `STATUS.md` remains the current-state
record, and an acceptance item may move to PASS only with a linked automated
check and observable dev/staging evidence.

## Delivery rules

- Build and test in a feature branch or Hedy dev; staging receives only an
  immutable, passing revision. Never promote to production autonomously.
- Prefer Hedy-native data, functions, schedules, secrets, and logs. Add an
  external service only after a measured limitation and a recorded decision.
- Treat each provider as an isolated adapter. Provider errors must produce
  source-health evidence without stopping other adapters.
- Real-source work must not precede confirmation of a permitted API, feed, or
  integration contract. Synthetic adapters are test fixtures and must be
  visibly identified; they never satisfy the real-source requirement alone.
- No acceptance checkbox is closed from code inspection alone.

## P0 — Executable application foundation

**Outcome:** one repeatable local/CI test command and a deployable server-side
application that can expose health and public product routes.

- [ ] Select the smallest Hedy-compatible runtime and record the choice in
  `DECISIONS.md`.
- [ ] Add formatting, unit, integration, and secret-scanning checks in CI.
- [ ] Define environment validation that fails safely when runtime secrets are
  absent while leaving public, non-integrated functionality usable.
- [ ] Add structured logs with `event`, `source`, `run_id`, `attempt`, and
  non-secret error details.
- [ ] Prove a deploy and synthetic request in dev before promotion.

**Exit evidence:** CI URL/output; dev revision identifier; health request and
log record. Covers the foundation of Operations and Governance criteria.

## P0 — Product and observation core

**Outcome:** durable, category-extensible catalog and append-only observations.

- [ ] Load a reviewed seed catalog of at least 30 active Pokemon TCG products.
- [ ] Implement repositories and reversible migrations for products, listings,
  observations, current state, source health, collection runs, watchlists, and
  alert events.
- [ ] Normalize inventory into `IN_STOCK`, `OUT_OF_STOCK`, `UNKNOWN`,
  `UNAVAILABLE`, or `ERROR`.
- [ ] Reject or quarantine ambiguous mapping instead of selecting a product.
- [ ] Add a deterministic synthetic adapter covering all normalized states,
  malformed input, timeouts, and ambiguous mappings.

**Exit evidence:** seed-count test; schema/repository integration tests;
append-only history test; normalization and fail-closed mapping tests.

### Minimum domain contracts

| Record | Required invariant / fields |
| --- | --- |
| Product | Stable internal ID, category, canonical name, family/set, image locator, optional GTIN/MSRP/release date, priority, active state. No retailer ID in the canonical identity. |
| Source listing | Source + source item ID is unique; canonical product ID is explicit; mapping status/confidence/evidence is retained; locator is allowed by the source contract. |
| Observation | Append-only ID; listing/source; observed-at timestamp; optional price + currency; normalized availability; raw evidence/provenance; adapter version; collection run ID. |
| Current state | Derived pointer/snapshot of the newest accepted observation; never substitutes for history. |
| Collection run | Stable run/idempotency key, scheduled time, start/end, per-source outcome and attempt counts. |
| Source health | Last attempt/success, status, latency/error class, consecutive failures; no credentials or sensitive response body. |
| Watch | User identity + product ID unique pair; created timestamp. |
| Alert event | Deterministic dedupe key, transition/reason, observation references, recipient, delivery state and attempts. |

Money must use an integer minor-unit amount plus ISO currency. Timestamps must
be UTC instants. Raw observations and derived indicators must be distinguishable.

## P0 — Collection, changes, and idempotency

**Outcome:** unattended scheduled collection produces trustworthy state and no
duplicate user-visible event on retries or replay.

- [ ] Run all enabled adapters independently on a schedule using a stable run
  key; place strict timeouts and bounded retry/backoff around each source.
- [ ] Append a normalized observation before updating current state.
- [ ] Compare the accepted prior state to the new observation and emit only
  configured meaningful transitions (restock, material price change, or new
  authorized watched listing).
- [ ] Enforce alert uniqueness durably with a deterministic key, not only an
  in-memory check.
- [ ] Exercise partial failure and exact job replay in integration tests.
- [ ] Surface adapter/run health through operator-visible logs and a health
  view/endpoint.

**Exit evidence:** scheduled dev execution without an interactive user;
failure-isolation, bounded-retry, transition, replay, and duplicate-suppression
test output; corresponding logs.

## P0 — Compliant real-source integrations

**Outcome:** three operating permitted sources or documented compliant
substitutes, each preserving provenance and usage constraints.

- [ ] For each candidate, record owner, access mechanism, permission/terms
  basis, authentication, allowed host(s), rate policy, attribution/link rules,
  cache/retention limits, and failure behavior before enabling it.
- [ ] Implement only approved API/feed/integration adapters and explicitly
  allowlist their outbound hosts.
- [ ] Label offer/asking prices as offers. Record completed-sale evidence only
  where the provider legitimately supplies it and retain that evidence type.
- [ ] Validate source item IDs against canonical mapping; quarantine uncertain
  joins.

**Exit evidence:** source-contract records for three sources, adapter contract
tests, successful dev observations from each, allowlist configuration, and
source-attributed UI/API output. Credential or provider enrollment blockers go
to `FOUNDER_ACTIONS.md` only when genuinely founder-only.

## P0 — Discord watch and alert path

**Outcome:** authenticated Discord interactions persist watches and return or
deliver source-attributed information.

- [ ] Verify interaction signatures and reject stale/invalid requests.
- [ ] Implement `/watch`, `/unwatch`, and `/value` with deterministic product
  resolution and explicit ambiguity/no-data responses.
- [ ] Persist Discord user/watch identity without exposing it publicly.
- [ ] Deliver watched transition events with source, observed time, price type,
  and locator; use bounded retry and the durable alert dedupe key.
- [ ] Make the web watch CTA open a documented, functioning Discord flow.

**Exit evidence:** interaction security tests; command integration tests across
restart; alert replay test; dev Discord interaction/delivery record. A bot token
must be supplied only through runtime secret storage.

## P0 — Public product intelligence web

**Outcome:** accessible browse/search and product detail experiences backed by
the observation store rather than fabricated fixture claims.

- [ ] Browse and search canonical active products.
- [ ] Show a stable product detail route with current observations, recent
  append-only history, source labels/links, observation time, availability,
  and unambiguous price type.
- [ ] Represent no-data, stale, unknown, unavailable, and source-error states
  honestly.
- [ ] Connect the watch CTA to the Discord watch path.
- [ ] Add responsive and accessibility-oriented automated browser coverage.

**Exit evidence:** desktop and mobile screenshots plus browser test output from
the promoted staging revision; current/history/provenance request evidence.

## P1 — Security, QA, and release evidence

**Outcome:** an independently reviewed, rollback-tested staging candidate.

- [ ] Scan repository and history for secrets; verify runtime secrets are
  configured outside Git.
- [ ] Adversarially test authorization/signatures, replay, ambiguous mapping,
  malformed provider data, source outages, price semantics, injection, and
  accidental sensitive logging.
- [ ] Resolve all Critical and High findings; do not waive them for milestone
  completion.
- [ ] Promote one immutable passing dev revision to staging, execute the full
  end-to-end suite, roll back to the previous revision, verify it, then restore
  the candidate by promotion.
- [ ] Have a non-implementing QA/release owner sign the acceptance matrix.
- [ ] Assemble the founder review package required by `RUNBOOK.md`, including a
  monthly cost estimate and factual release recommendation.

**Exit evidence:** security report, independent sign-off, staging URL/revision,
end-to-end output, rollback and restoration revision IDs, logs, screenshots,
cost estimate, and known limitations.

## Acceptance traceability matrix

Statuses below describe the repository at backlog creation, not anticipated
work. `NOT STARTED` means no qualifying implementation/evidence was found.

| Acceptance section | Current status | Delivery slice | Required proof |
| --- | --- | --- | --- |
| Product and data (8) | NOT STARTED | Product core; real sources | Seed count; schema/repository, adapter, history, normalization, provenance and ambiguous-map tests; three permitted-source dev observations |
| Monitoring (7) | NOT STARTED | Collection/changes | Scheduled run; partial-failure, retry-bound, transition, replay/dedupe tests; health/log evidence |
| Discord (6) | NOT STARTED | Discord path | Signature and command tests; persistence across restart; dev command and alert-delivery evidence |
| Web (9) | Bootstrap shell only; required behavior NOT STARTED | Public web | Browser/API tests and desktop/mobile staging evidence for browse, search, detail, current/history/provenance, and watch CTA |
| Governance / safety (10) | Policies documented; implementation and audit NOT STARTED | Sources; Security/QA | Secret scan, runtime-secret and host-allowlist evidence, source contracts, pricing semantic tests, security report, staging/prod audit |
| Operations (8) | Bootstrap staging smoke recorded; MVP evidence NOT STARTED | Foundation; Security/QA | Logs and diagnosable failure evidence; unit/integration/E2E results; tested rollback; independent QA and adversarial sign-off |

## Dependency order and parallel lanes

1. Foundation and domain contracts unblock all engineering.
2. Catalog/repositories and synthetic adapters unblock monitoring, web, and
   Discord tests without waiting for external credentials.
3. Source-contract research can proceed independently, but real adapters cannot
   be called accepted without permitted live evidence.
4. Web and Discord can proceed in parallel once repository interfaces stabilize.
5. Security/QA begins with the first implementation, then performs final review
   on the immutable staging candidate.
6. Staging promotion and rollback follow a fully passing dev revision; production
   is outside autonomous scope.

## Architecture decisions still required

The implementation owner should record these once the Hedy runtime contract is
confirmed: runtime/language and package strategy; Hedy collection and transaction
semantics; route/function/schedule shape; authentication boundary; outbound-host
allowlist mechanism; and revision/rollback procedure. These are reversible
engineering decisions and are not founder questions.

## 2026-09-30 evidence update

- Exact PR head authenticated Hedy dry-run: PASS with no warnings/errors; immutable revision stored but not deployed.
- Isolated non-production Hedy core runtime: PASS for static/API routes, schedule execution, real `ctx.data`, replay dedupe, stale history, health, and logs.
- Repository now has deterministic self-contained manifest generation plus a manual, dev-only official CLI sync workflow that stages file bytes.
- Remaining dependency is founder-owned credential/OIDC provisioning for main dev and Discord/provider identities; staging E2E and rollback follow a passing main-dev revision. Production remains out of scope.
