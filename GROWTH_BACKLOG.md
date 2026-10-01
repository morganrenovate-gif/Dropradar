# DropRadar Growth & Revenue Backlog

This backlog runs in parallel with BUILD_BACKLOG.md. It does not weaken product acceptance or source-compliance requirements.

## G0 — Instrument the business loop
Outcome: DropRadar can measure the path from product discovery to watch intent and retailer click without inventing conversion data.

- [ ] Define a minimal growth event schema with anonymous/session-safe identifiers.
- [ ] Track product-page view, search, Discord CTA click, watch intent, retailer-link click, and referral source.
- [ ] Add a retailer-link configuration layer that can hold normal or affiliate URLs without hard-coding credentials.
- [ ] Add an auditable outbound retailer redirect path that validates product + retailer and records attribution before redirect.
- [ ] Add UTM/referral capture and preserve first-touch + last-touch fields where technically reasonable.
- [ ] Add operator-visible funnel counts with no sensitive Discord/user data exposed publicly.
- [ ] Write tests proving missing/invalid retailer links fail closed and tracking never changes source evidence.

Exit evidence: deployed dev events from real page/CTA interactions; integration tests; no secrets or affiliate IDs exposed in client source.

## G1 — Make joining Discord an actual conversion path
Outcome: every relevant public page has a functioning, measurable path into the DropRadar community.

- [ ] Replace generic Discord links with one configured DropRadar invite/install destination.
- [ ] Add concise onboarding copy explaining the free value in under 30 seconds.
- [ ] Define the initial server channel structure and moderation/escalation rules.
- [ ] Add a post-join onboarding prompt that gets a member to their first product watch quickly.
- [ ] Capture the originating product/referral when technically possible.
- [ ] Test desktop/mobile CTA behavior.

Exit evidence: working dev/staging CTA, measured clicks, onboarding script/channel plan, QA review.

## G1 — Programmatic SEO/product acquisition
Outcome: products can be discovered from search without requiring social media.

- [ ] Create stable, indexable product URLs instead of dialog-only product details.
- [ ] Render source-attributed current observations and recent history server-side or in crawlable HTML.
- [ ] Add unique title/meta copy per product and set.
- [ ] Add canonical URLs and sitemap generation.
- [ ] Add structured data only where it truthfully matches the page.
- [ ] Add internal links between product/set/category pages.
- [ ] Preserve stale/no-data/unknown states honestly.

Exit evidence: crawlable dev/staging pages, sitemap, metadata tests, no fabricated inventory.

## G1 — Content engine
Outcome: verified DropRadar signals can become repeatable short-form/community content without manual rewriting.

- [ ] Define reusable content templates for restock, price move, new release, market comparison, and educational posts.
- [ ] Build a queue record containing source evidence, timestamp, hook, script, caption, CTA, and publication state.
- [ ] Generate drafts only from verified product/source records or explicitly labeled editorial topics.
- [ ] Add review rules that block stale/ambiguous stock claims.
- [ ] Prepare platform-specific variants for TikTok/Reels/Shorts/Discord.
- [ ] Keep publishing disabled until a connected account and approved publication policy exist.

Exit evidence: content queue populated from real DropRadar data with source traceability and Growth QA pass.

## G2 — Affiliate revenue
Outcome: eligible retailer clicks can create attributable commission revenue without changing the user's price or obscuring the retailer.

- [ ] Record Walmart/Best Buy/Amazon/eBay program status and required IDs/keys.
- [ ] Add provider-specific affiliate URL builders only after acceptance into each program.
- [ ] Add required disclosure copy.
- [ ] Reconcile click counts against available affiliate reports.
- [ ] Build a simple revenue ledger for commissions/payouts actually reported by providers.
- [ ] Prevent unapproved programs from rendering affiliate claims or tags.

Exit evidence: one approved retailer link works end-to-end in dev/staging; attribution recorded; provider report/revenue state distinguish clicks from actual commission.

## G2 — Community growth experiments
Outcome: acquire qualified collectors without buying followers or spamming communities.

- [ ] Create a small set of founder-independent organic experiments: short-form content, SEO, creator partnerships, referral prompts.
- [ ] Define one metric per experiment before launch.
- [ ] Stop experiments that produce low-quality joins or moderation risk.
- [ ] Create creator/referral attribution links.
- [ ] Keep paid ads disabled until founder authorizes a budget.

Exit evidence: experiment log with source -> join -> watch quality, not raw follower count alone.

## G3 — Monetization experiment gate
Outcome: introduce paid features only after the free product repeatedly creates value.

Prerequisites:
- deployed real retailer inventory/availability source;
- functioning Discord/watch loop;
- measurable retailer-click path;
- repeat use from real users;
- no unresolved High/Critical growth/compliance issues.

Then:
- [ ] Test one simple premium offer first.
- [ ] Keep core source truth free.
- [ ] Measure paid conversion and retention.
- [ ] Do not add additional tiers until the first offer has evidence.

## Current external dependencies
- Walmart affiliate/provider review: pending.
- Best Buy developer review: pending.
- Amazon Associates/Creators API eligibility: onboarding / later sales threshold.
- Retail inventory source remains the key product-growth dependency.

## Current autonomous priority
While provider approvals are pending, agents should work in this order:
1. instrumentation + retailer redirect foundation;
2. indexable product pages + Discord conversion path;
3. content queue/templates;
4. affiliate configuration framework;
5. community onboarding;
6. retailer integration immediately when an approved provider becomes available.
