import { defineConfig } from 'vitepress';

// Set VITEPRESS_BASE=/your-repo-name/ for GitHub Pages project sites
const base = process.env.VITEPRESS_BASE ?? '/';

export default defineConfig({
  title: 'shieldkit',
  titleTemplate: ':title · shieldkit docs',
  description:
    'shieldkit (npm) — production guardrails, structured output repair, and compliance for the Vercel AI SDK. v0.2.0: homoglyph evasion hardening, 31-check demo tour, GitHub Release automation.',
  base,
  srcDir: '../docs',
  outDir: '.vitepress/dist',
  cleanUrls: true,
  head: [
    ['meta', { name: 'theme-color', content: '#4f46e5' }],
    [
      'meta',
      {
        name: 'description',
        content:
          'Production guardrails for the Vercel AI SDK — injection, PII, keywords, structured output repair, cost budgets, audit logging, and tool policies.',
      },
    ],
    ['meta', { property: 'og:title', content: 'shieldkit — AI SDK guardrails' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Wrap any LanguageModel with shield() for input/output safety, JSON repair, session budgets, and audit trails. Verified with 163 automated tests.',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
  ],
  vite: {
    esbuild: {
      target: 'esnext',
    },
    build: {
      target: 'esnext',
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'shieldkit',
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Features', link: '/features/input-guardrails' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/reference' },
      { text: 'Testing', link: '/testing/running-tests' },
      {
        text: 'v0.2.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/sakurablush/shieldkit/blob/main/CHANGELOG.md#020---2026-06-18',
          },
          { text: 'npm package', link: 'https://www.npmjs.com/package/shieldkit' },
          { text: 'npm publishing guide', link: '/contributing/npm-publishing' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Examples', link: '/examples/' },
          { text: 'Deployment', link: '/DEPLOYMENT' },
          { text: 'Contributing', link: '/contributing' },
          { text: 'CI and automation', link: '/contributing/ci-and-automation' },
          { text: 'npm publishing', link: '/contributing/npm-publishing' },
          { text: 'Dependency policy', link: '/contributing/dependency-policy' },
          { text: 'Cursor Agent Skills', link: '/contributing/cursor-skills' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/architecture/overview' },
          { text: 'Request Lifecycle', link: '/architecture/request-lifecycle' },
          { text: 'Configuration', link: '/architecture/configuration' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Input Guardrails', link: '/features/input-guardrails' },
          { text: 'Output Guardrails', link: '/features/output-guardrails' },
          { text: 'Structured Output', link: '/features/structured-output' },
          { text: 'Cost Tracking', link: '/features/cost-tracking' },
          { text: 'Audit Logging', link: '/features/audit-logging' },
          { text: 'Tool Guards', link: '/features/tool-guards' },
        ],
      },
      {
        text: 'Design',
        items: [
          { text: 'Why Middleware', link: '/design/why-middleware' },
          { text: 'Trade-offs', link: '/design/trade-offs' },
          { text: 'Limitations', link: '/design/limitations' },
        ],
      },
      {
        text: 'Testing',
        items: [
          { text: 'Running Tests', link: '/testing/running-tests' },
          { text: 'Writing Tests', link: '/testing/writing-tests' },
          { text: 'Verification Matrix', link: '/testing/verification-matrix' },
          { text: 'Unit Coverage Audit', link: '/testing/unit-coverage-audit' },
          {
            text: 'Adversarial Assurance Plan',
            link: '/testing/adversarial-assurance-plan',
          },
          {
            text: 'Security Assurance Report',
            link: '/testing/SECURITY_ASSURANCE_REPORT',
          },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api/reference' },
          { text: 'Security', link: '/security-policy' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sakurablush/shieldkit' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/shieldkit' },
    ],
    footer: {
      message:
        'MIT Licensed · <a href="https://www.npmjs.com/package/shieldkit" target="_blank" rel="noreferrer">npm: shieldkit@0.2.0</a>',
      copyright: 'shieldkit contributors',
    },
    outline: [2, 3],
    search: {
      provider: 'local',
    },
  },
});
