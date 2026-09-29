# DropRadar MVP Product Specification

## Customer
Collectors who want fast, trustworthy availability and price information for desirable Pokemon TCG products.

## Core jobs
1. Find out when a watched product becomes available.
2. Know the observed retailer price and source.
3. Understand recent market context without confusing asking prices with completed-sale evidence.
4. Maintain a personal watchlist.
5. Receive useful Discord alerts without duplicate spam.
6. Open a public product page and see current and recent evidence.

## Canonical product model
Each product should support:
- internal product id;
- canonical name;
- set / release family;
- image;
- UPC / GTIN where available;
- MSRP when supported by a reliable source;
- release date when known;
- retailer-specific identifiers;
- priority / active state.

Retailer naming differences must map back to one canonical product when confidence is sufficient. Uncertain mappings must fail safely rather than silently merge products.

## Observation model
Every source observation must preserve:
- source;
- source item id;
- timestamp;
- observed price;
- availability state;
- URL or source locator when permitted;
- evidence / provenance metadata;
- parser or adapter version where useful.

History must not be overwritten by the latest state.

## Inventory states
Initial normalized states:
- IN_STOCK
- OUT_OF_STOCK
- UNKNOWN
- UNAVAILABLE
- ERROR

## Alert behavior
Alert on meaningful transitions such as:
- OUT_OF_STOCK -> IN_STOCK;
- meaningful price change;
- new authorized listing for a watched product.

Alerts must be idempotent and duplicate-suppressed.

## Discord
Required:
- product alerts;
- `/watch <product>`;
- `/unwatch <product>`;
- `/value <product>`;
- retailer/source attribution;
- persistent watchlists.

## Public web
Required:
- product search/browse;
- product detail page;
- current source observations;
- recent history;
- source provenance;
- watch CTA;
- mobile and desktop usability.

## Pricing language
Never present unsupported precision.

Clearly distinguish:
- retail/MSRP;
- current observed offer/asking price;
- completed-sale evidence, when legitimately available;
- derived indicators.

Do not call an asking price a completed sale.

## Initial scale
At least 30 active canonical Pokemon products.

## Expansion
The data model should not hard-code Pokemon-specific assumptions that prevent later support for One Piece, Magic, sports cards, LEGO, Hot Wheels, or other collectible categories.
