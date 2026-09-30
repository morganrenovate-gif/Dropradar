# DropRadar Status

## Phase
MAIN DEV LIVE MARKET-DATA + DISCORD E2E PASS — STAGING / RETAILER-INVENTORY GATES PENDING

## Current objective
Keep dev operational with the real sealed-product market-data lane and Discord alerts, then add at least one authorized retailer inventory source and move the verified candidate into staging. Production remains untouched and founder-controlled.

## Main dev evidence
- Discord endpoint verification and real `/watch`, `/value`, `/unwatch` commands: PASS.
- Real Discord alert delivery: PASS.
- Live `pokemontcgapi.com` sealed-product request: PASS.
- Provider source health: `HEALTHY`.
- Strong product mapping proved for 151 Elite Trainer Box and Surging Sparks Elite Trainer Box.
- Real market quotes persist with provider provenance, basis, observation date, sample count, and currency.
- Inventory state remains `UNKNOWN`; market price observations are not represented as retailer stock.
- Validation-only watch rows were removed after testing.
- `collect-pokemontcg` runs once daily at 18:17 UTC.
- `deliver-alerts` is enabled every minute.
- Legacy import collector remains disabled.

## Display/compliance repair
The first live provider proof returned EUR Cardmarket data and exposed that the old frontend formatted every price as USD. The dev frontend is now currency-aware and displays the upstream provenance string. Discord value and alert output also use provider provenance and explicit currency.

Served dev `/app.js` SHA-256:
`d0da2f2d6ff2a979bb39803acd92fdc2391126c6b8acd46e3112c50542e09906`.

## Active Hedy dev
- Revision: `apprev_1790793614115_97bb494d24e84426bc9ee88ef9f5e3d9`
- Host: `dropradar--morgan-projects--dev.apps.hedyassist.com`
- Staging: unchanged from bootstrap.
- Production: Draft / untouched.

## Remaining gates
1. Add an authorized retailer-inventory source. Best Buy access is pending provider approval; do not scrape consumer storefronts as a fallback.
2. Provision the required app credentials into staging through sealed provisioning.
3. Promote the verified candidate to staging; rerun UI/API/Discord/live-source E2E and rollback/restore.
4. Establish an always-on hosted Hedy CLI path before depending on GitHub Actions for unattended deployments.
5. Production promotion remains an explicit founder-controlled action.

## GitHub
- Repository: `morganrenovate-gif/Dropradar`
- Branch: `work`
- Pull request: https://github.com/morganrenovate-gif/Dropradar/pull/1 (draft)
