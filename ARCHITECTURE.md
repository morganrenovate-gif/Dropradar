# DropRadar MVP Architecture

## Source of truth
GitHub repository.

## Initial runtime
Hedy hosted app.

## Hedy responsibilities
- hosted frontend;
- server-side functions;
- project-isolated app data;
- scheduled polling / background jobs;
- secrets;
- outbound HTTPS to explicitly approved hosts;
- authentication if/when required;
- logs;
- analytics and audit;
- dev / staging / prod environments;
- revisions, promotion and rollback;
- synthetic request testing.

## Development lane model
- builders work in branches and/or Hedy sandbox/dev;
- dev is integration;
- staging is promotion-only and used for end-to-end acceptance;
- prod is founder-controlled release only.

No direct edits to staging or production.

## Core runtime flow
authorized data source
-> source adapter
-> normalized observation
-> durable history
-> state-change detector
-> deduplication
-> alert event
-> Discord / web presentation

## Initial data domains
- products
- source listings
- observations
- current product-source state
- users
- watchlists
- alert events
- source health
- market observations
- system decisions / audit events as needed

## Scaling rule
Start Hedy-first.

Do not introduce an external database, queue, worker platform, or scraper fleet merely because it is conventional.

Add specialized infrastructure only when measured limits, reliability requirements, data volume, or provider constraints justify it. Record the reason in DECISIONS.md.

## External source rule
Prefer:
1. official APIs;
2. approved affiliate/catalog feeds;
3. provider-authorized integrations;
4. other clearly permitted access.

Do not defeat bot protections, bypass access controls, evade rate limits, or build a system whose business depends on prohibited access.

## Git / CI
Every material code change should be reviewable in GitHub.
Automated checks should run before promotion to staging.
Production remains human-authorized.
