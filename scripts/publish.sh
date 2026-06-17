#!/usr/bin/env bash
set -euo pipefail

# Publish shieldkit — run after `npm login` and full CI gate.
VERSION="$(node -p "require('./package.json').version")"

npm run ci
npm run build
npm run docs:build
npm pack --dry-run
npm publish --access public

echo "Published shieldkit@${VERSION}"
echo "Next: git tag v${VERSION} && git push origin v${VERSION}"
echo "Then create GitHub Release from CHANGELOG [${VERSION}]"
