# Publish shieldkit — run after `npm login` and full CI gate.
$ErrorActionPreference = "Stop"

$version = node -p "require('./package.json').version"

npm run ci
npm run build
npm run docs:build
npm pack --dry-run
npm publish --access public

Write-Host "Published shieldkit@$version"
Write-Host "Next: git tag v$version; git push origin v$version; create GitHub Release from CHANGELOG [$version]"
