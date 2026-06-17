#!/usr/bin/env bash
set -euo pipefail

# Publish shieldkit@0.1.0 — run after `npm login` and full CI gate.
npm run ci
npm run build
npm run docs:build
npm pack --dry-run
npm publish --access public

echo "Next: git tag v0.1.0 && git push origin v0.1.0"
echo "Then create GitHub Release from CHANGELOG [0.1.0]"
