#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

auth_mode="token"
if [[ -z "${HEDY_TOKEN:-}" ]]; then
  auth_mode="oidc"
  if [[ -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" || -z "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}" ]]; then
    echo "Hedy authentication is required: provide scoped HEDY_TOKEN or GitHub Actions OIDC." >&2
    exit 2
  fi
  if [[ -z "${HEDY_COMPANY_ID:-}" || -z "${HEDY_CI_TRUST_ID:-}" || -z "${HEDY_OIDC_AUDIENCE:-}" ]]; then
    echo "Hedy OIDC configuration is incomplete: company, CI trust policy, and audience are required." >&2
    exit 4
  fi
fi
if ! command -v hedy >/dev/null 2>&1; then
  echo "The official Hedy CLI must be installed on this runner." >&2
  exit 3
fi

npm run check:hedy
node - <<'NODE'
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync('hedy.app.json', 'utf8'));
for (const definition of [...manifest.functions, ...manifest.modules]) {
  if (typeof definition.code !== 'string' || !definition.code.length || 'sourcePath' in definition) {
    throw new Error(`deploy manifest is not self-contained: ${definition.name}`);
  }
}
NODE

if [[ "$auth_mode" == "oidc" ]]; then
  # Prevent an empty or inherited token from changing the authoritative CI flow.
  unset HEDY_TOKEN
  hedy login --ci \
    --company "$HEDY_COMPANY_ID" \
    --policy "$HEDY_CI_TRUST_ID" \
    --audience "$HEDY_OIDC_AUDIENCE"
fi

# This is intentionally the only deployment command: Hedy CLI stages static file
# bytes before syncing the revision, and the target is hard-coded to dev.
exec hedy app sync --environment dev
