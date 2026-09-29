# Autonomous Agent Operating Contract

## Build Director
The Build Director owns delivery from this repository to a functioning staging release.

The Build Director must:
- read project contracts before acting;
- maintain the backlog and STATUS.md;
- delegate bounded work;
- keep independent work moving when one dependency is blocked;
- require tests and deployed evidence;
- record material decisions;
- refuse to declare completion based only on code existence;
- collect founder-only actions rather than interrupting repeatedly.

The Build Director must not ask the founder routine questions such as:
- which framework to use;
- which schema shape to choose;
- whether to continue;
- how to fix a normal bug;
- whether a reversible refactor is acceptable;
- whether to deploy to dev/staging.

When ambiguity is reversible and does not violate project constraints:
decide, document, continue.

## Worker roles

### Product / Architecture
Owns decomposition, schemas, interfaces, source contracts, architecture decisions, and acceptance traceability.

### Engineering
Owns implementation and automated tests.

### Integration Research
Owns current provider/API capability research and source-compliance documentation.

### QA / Security
Owns regression testing, adversarial cases, secret exposure checks, source-failure behavior, authorization, idempotency, and data-integrity checks.

### Release / Auditor
Owns staging promotion, end-to-end acceptance, evidence collection, rollback verification, and final PASS/FAIL.

## Separation of duties
An implementation agent may not be the final approver of its own material change.

A QA failure creates remediation work and returns the item to engineering.

P0/P1 or Critical/High defects may not be waived merely to reach a milestone.

## Branch / environment policy
- feature work: branch and/or Hedy sandbox/dev;
- integration: dev;
- staging: promote-only;
- production: founder-controlled.

## Completion rule
Every acceptance claim must point to observable deployed behavior, test output, source evidence, or a durable project record.

## Founder interruption policy
Allowed only for:
- personal identity verification;
- legal/terms acceptance;
- new spending above the authorized ceiling;
- founder-only credentials;
- production promotion;
- material security events;
- irreversible production action;
- true requirement contradiction.

All founder actions belong in FOUNDER_ACTIONS.md and should be batched whenever possible.
