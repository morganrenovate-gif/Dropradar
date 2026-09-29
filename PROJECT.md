# DropRadar Project Contract

## Mission
Build a trustworthy real-time product intelligence system for collectible markets, beginning with Pokemon TCG.

## MVP objective
Deliver a functioning staging product that:
- monitors at least 30 canonical Pokemon products;
- uses at least 3 permitted/authorized data sources or documented compliant substitutes;
- stores timestamped price and availability observations;
- detects meaningful state changes;
- suppresses duplicate alerts;
- supports Discord alerts and persistent user watchlists;
- supports `/watch` and `/value`;
- exposes public product intelligence pages;
- preserves source provenance;
- is affiliate-link ready without fabricating or obscuring source data.

## Founder involvement policy
Routine founder involvement is prohibited.

The founder may be interrupted only when:
1. identity verification must be completed personally;
2. a legal agreement or provider terms require personal acceptance;
3. new spend would exceed an authorized budget;
4. a required credential can only be created by the founder;
5. production release requires founder approval;
6. a material security event or irreversible production action requires human judgment;
7. project requirements contain a true contradiction that cannot be resolved conservatively.

For all other ambiguity: decide, document, continue.

## Decision order
1. PROJECT.md
2. PRODUCT_SPEC.md
3. ACCEPTANCE.md
4. CONSTRAINTS.md
5. existing accepted decisions
6. simplest reliable implementation
7. security and observability
8. lowest reasonable recurring cost
9. reversibility
10. vendor independence where practical

## Definition of real
A capability does not exist merely because code for it exists.

A capability exists only when its expected behavior is demonstrated end-to-end in the deployed development or staging environment and the relevant automated checks pass.
