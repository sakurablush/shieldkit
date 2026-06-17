# Publish shieldkit — run after `npm login` and full CI gate.
$ErrorActionPreference = "Stop"

npm run ci
npm run build
npm run docs:build
npm pack --dry-run
npm publish --access public

Write-Host "Next: git tag v0.1.0; git push origin v0.1.0; create GitHub Release from CHANGELOG"
