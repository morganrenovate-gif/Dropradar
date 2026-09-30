#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

if [[ -z "${HEDY_TOKEN:-}" && ( -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" || -z "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}" ) ]]; then
  echo "Hedy authentication is required: provide scoped HEDY_TOKEN or GitHub Actions OIDC." >&2
  exit 2
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

# This is intentionally the only deployment command: Hedy CLI stages static file
# bytes before syncing the revision, and the target is hard-coded to dev.
exec hedy app sync --environment dev
