# Source Compliance and Integration Register

Last reviewed: 2026-09-30
Owner: Integration Research

## Policy

DropRadar uses only documented APIs, provider-approved feeds, or data deliberately supplied by an operator who is authorized to supply it. Adapters must identify themselves honestly, preserve the provider/item locator and observation time, and stop rather than silently substitute invented data. Asking or offer prices are never labeled as completed sales.

No adapter may scrape a consumer storefront, bypass a bot challenge, rotate identities to evade quotas, or call an undocumented private endpoint. A provider returning `401`, `403`, `429`, a challenge, or a restrictive policy response is a terminal/degraded source-health event for that polling run; bounded retry applies only where the provider permits it.

## MVP source plan (three compliant, secret-free substitutes)

The three MVP lanes below can run locally and in staging without a provider secret. They are **compliant substitutes**, not claims that a retailer has granted live API access. Each accepted record must carry `source`, `source_item_id`, `observed_at`, `source_url`, `evidence_kind`, and adapter version.

| Source key | Secret-free MVP input | Permitted use and guardrail | Upgrade path |
|---|---|---|---|
| `pokemon_catalog_import` | Version-controlled, reviewed JSON records transcribed from official Pokémon product pages or an operator-supplied export | Canonical product identity, release-family, image/source locator, and published MSRP only. A catalog entry is not inventory evidence. Refresh only through reviewable imports; do not crawl the storefront. | Replace or supplement only with a documented Pokémon-approved catalog/feed agreement. |
| `ebay_authorized_import` | JSON/CSV export supplied by an authorized operator, plus deterministic fixtures in tests | Current listing/asking-price observations only. Store the eBay item ID and public item URL. Never describe a listing price as a completed sale. Reject stale, malformed, or identity-ambiguous rows. | eBay Browse API after OAuth application credentials are provisioned in runtime secret storage. |
| `bestbuy_authorized_import` | JSON/CSV export supplied by an authorized operator, plus deterministic fixtures in tests | Retail offer and normalized availability evidence only. Preserve SKU and product URL. Imports must identify their acquisition time; unknown or stale status remains `UNKNOWN`, never inferred `IN_STOCK`. | Best Buy Products API after an API key is provisioned in runtime secret storage. |

This design makes the substitutes operationally testable while failing honestly when no authorized real observation is available. Synthetic fixtures are always labeled `evidence_kind: synthetic` and must be excluded from public “live” claims. Imported real records use `evidence_kind: authorized_import`; the importer does not attest that the record remains current after its timestamp.

## Provider constraints and primary-source evidence

### Pokémon product catalog

Pokémon's public site is useful as a human-reviewed provenance locator, but this review found no documented public storefront inventory API suitable for unattended polling. The safe MVP choice is therefore a curated import and no automated storefront access.

- [Pokémon Terms of Use](https://www.pokemon.com/us/legal/terms-of-use) governs use of Pokémon web properties and content.
- [Pokémon Center Terms of Use](https://www.pokemoncenter.com/terms-of-use) is the relevant provider contract for its storefront.
- [Pokémon TCG product catalog](https://www.pokemon.com/us/pokemon-tcg/product-gallery/) can be retained as the publisher locator for manually reviewed catalog facts.

Constraint: publisher/catalog facts do not establish retailer stock, an observed retailer offer, or a completed sale. Store only facts supported by the cited page and retain its locator.

### eBay

The documented automated path is eBay's Buy Browse API. It requires an OAuth application token; it is not a secret-free live source. Production use must stay within the application's published call limits and eBay's API license/terms.

- [Browse API overview](https://developer.ebay.com/api-docs/buy/browse/overview.html) documents item search and item detail capabilities.
- [Client credentials grant](https://developer.ebay.com/api-docs/static/oauth-client-credentials-grant.html) documents application-token acquisition.
- [API call limits](https://developer.ebay.com/develop/get-started/api-call-limits) documents that limits vary by API and application and describes increase requests.
- [eBay API License Agreement](https://developer.ebay.com/join/api-license-agreement) governs API data use.

Constraints: do not call Browse without valid credentials, exceed the assigned quota, or infer a completed sale from an active listing. OAuth credentials belong only in sealed runtime storage. Until those conditions are met, accept only an authorized export and expose its age.

### Best Buy

Best Buy's documented Products API requires an API key. Its documentation describes products, stores, categories, recommendations, and buying-options resources. Consequently, an unattended live adapter cannot operate secret-free.

- [Best Buy API documentation](https://bestbuyapis.github.io/api-documentation/) documents the supported APIs and API-key request format.
- [Best Buy developer portal](https://developer.bestbuy.com/) is the provider-controlled registration and key-management entry point.
- [Best Buy API terms](https://bestbuyapis.github.io/api-documentation/#terms-of-use) links the conditions governing API usage.

Constraints: use only a provider-issued key kept in runtime secret storage; honor provider responses and quota guidance; never scrape the consumer storefront as a fallback. Without a key, use an explicitly authorized timestamped import and mark availability `UNKNOWN` when the import supplies no unambiguous status.

## Optional metadata enrichment (not one of the three retail lanes)

The community [Pokémon TCG API](https://docs.pokemontcg.io/) can enrich card/set metadata but is not an authoritative sealed-product inventory feed. Its [authentication documentation](https://docs.pokemontcg.io/getting-started/authentication/) permits requests without an API key at a lower limit, and its [rate-limit documentation](https://docs.pokemontcg.io/getting-started/rate-limits/) defines the current anonymous and authenticated quotas. An implementation must read and respect returned rate-limit headers rather than hard-code a remembered quota. It must not convert card-market fields into sealed-product retail observations.

## Runtime enforcement checklist

1. Allowlist only the exact API hosts needed by enabled live adapters; import-only adapters require no outbound retailer host.
2. Keep OAuth client secrets and API keys in Hedy secret management or equivalent runtime storage, never repository files or logs.
3. Attach adapter version, retrieval/import timestamp, original source item ID, source locator, and evidence kind to every observation.
4. Reject an import row unless its source namespace and required provenance fields are present.
5. Fail closed on ambiguous UPC/SKU/title mapping and record the rejection in source health.
6. Use provider quota headers where available; bound retries, honor `Retry-After`, and never retry authentication/authorization failures as if transient.
7. Keep stale, error, and `UNKNOWN` states visible. Never carry an old `IN_STOCK` value forward as fresh evidence.
8. Exclude synthetic observations from public current-state summaries and outbound user alerts unless the environment is explicitly a test environment.
9. Review provider documentation and terms before enabling a live adapter; record the review date and any credential/legal founder action.

## Verification limitation

The primary-source URLs above are durable evidence locators. During the 2026-09-30 repository review, this execution environment's outbound proxy returned `403 CONNECT tunnel failed`, so their current page bodies could not be independently fetched from the container. Live enablement therefore requires a fresh terms/capability review from a network that can reach the provider sites. This limitation does not prevent implementing or testing the three import substitutes.
