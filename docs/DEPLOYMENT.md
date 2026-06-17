# Deploying Documentation (GitHub Pages)

shieldkit documentation is built with [VitePress](https://vitepress.dev/) from the `docs/` folder. The npm package does **not** include docs — only the static site is published.

## Prerequisites

- Public GitHub repository (GitHub Pages on the Free plan requires a public repo)
- Node.js ≥ 20
- `npm ci` completed locally

## Enable GitHub Pages

1. Open the repository on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Save

The workflow [`.github/workflows/docs.yml`](../.github/workflows/docs.yml) runs on every push to `main`/`master` and on manual dispatch.

## First deploy

1. Push to `main` or `master`
2. Open **Actions** → **Docs** workflow
3. Wait for **build** and **deploy** jobs to complete (typically 1–3 minutes)
4. Refresh **Settings** → **Pages** for the live URL:

```
https://<owner>.github.io/<repo-name>/
```

The workflow sets `VITEPRESS_BASE=/<repo-name>/` automatically for project sites.

## Local preview

```bash
npm run docs:dev
```

Opens VitePress at `http://localhost:5173` (default). Use `/` as base locally.

## Production build

```bash
# Match GitHub Pages base path for a project site named "shieldkit":
VITEPRESS_BASE=/shieldkit/ npm run docs:build

npm run docs:preview
```

Output: `website/.vitepress/dist/`

## CI integration

The main CI workflow runs `npm run docs:build` on every push and PR. Broken internal links fail the build before deploy.

## Custom domain (optional)

1. **Settings** → **Pages** → **Custom domain**
2. Add the DNS records GitHub provides
3. Enable **Enforce HTTPS** after certificate issuance
4. Set `VITEPRESS_BASE=/` in the docs workflow if the site is served from the domain root

## Branch protection (recommended)

Require the **CI** check to pass before merging to `main`. The docs workflow does not re-run the full test suite — it only builds the site. Branch protection prevents deploying docs from commits that fail tests.

## Related

- [Contributing](./contributing.md)
- [Running tests](./testing/running-tests.md)
