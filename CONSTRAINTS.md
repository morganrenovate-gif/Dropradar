# DropRadar Constraints

## Access and compliance
- Use permitted and authorized data access.
- Do not bypass bot protection, authentication, access controls, provider rate limits, or terms restrictions.
- Do not disguise automated traffic to evade enforcement.
- Do not fabricate inventory, pricing, sales, demand, or provenance.

## Security
- Never commit secrets.
- Use sealed/runtime secret storage.
- Least privilege for API keys and machine identities.
- Staging and production are promotion-only.
- Production remains founder-controlled.
- Destructive production operations require explicit human authorization.

## Cost
Target pre-scale infrastructure cost: under $100/month where practical.

Agents may choose free tiers and open-source components.
Agents may not create paid commitments or exceed the authorized ceiling without founder approval.

## Data quality
- Preserve observation history.
- Preserve source attribution.
- Distinguish raw observations from derived indicators.
- Fail closed on uncertain canonical-product mappings.
- Make stale/error states visible.

## Product scope
MVP is Pokemon-first.
Do not expand into additional collectible verticals until the MVP acceptance contract passes or an explicit decision changes scope.

## Engineering
- Idempotent scheduled jobs.
- Bounded retries.
- No duplicate user-visible alerting on replay.
- Measurable source health.
- Reversible migrations where practical.
- Prefer simple architecture until scale proves the need for additional services.
