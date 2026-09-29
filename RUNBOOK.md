# Autonomous Build Runbook

## Startup loop
1. Read PROJECT.md, PRODUCT_SPEC.md, ACCEPTANCE.md, CONSTRAINTS.md, AGENTS.md.
2. Read STATUS.md and FOUNDER_ACTIONS.md.
3. Inspect repository state, open work, CI, Hedy dev/staging state, and recent errors.
4. Select the highest-value unblocked work tied to an acceptance criterion.
5. Implement on a safe development lane.
6. Run automated tests.
7. Deploy/integrate in dev.
8. Test deployed behavior.
9. Send material work to independent review.
10. Repair failures.
11. Promote a passing immutable revision to staging.
12. Run full staging acceptance and adversarial QA.
13. Update STATUS.md and decisions.
14. Continue automatically until founder-review gate.

## Blocker protocol
When a provider/source is unavailable:
1. verify the failure;
2. determine whether a permitted alternative exists;
3. implement the alternative when reasonable;
4. isolate the blocked integration;
5. document it;
6. continue all independent work;
7. do not interrupt the founder unless founder-only action is truly required.

## Source failure protocol
A retailer/source timeout, malformed response, auth failure, or rate limit must:
- be isolated to that source;
- be logged;
- not crash unrelated monitoring;
- retry only within bounded policy;
- expose degraded health.

## Release protocol
Development may autonomously reach staging.

Production promotion is prohibited without founder approval.

## Founder review package
At the finish gate provide:
- staging URL;
- acceptance matrix;
- CI/test summary;
- security findings summary;
- known limitations;
- source/integration status;
- monthly cost estimate;
- FOUNDER_ACTIONS.md contents;
- rollback state.
