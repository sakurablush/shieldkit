import { defineConfig } from 'vitepress';

// Set VITEPRESS_BASE=/your-repo-name/ for GitHub Pages project sites
const base = process.env.VITEPRESS_BASE ?? '/';

export default defineConfig({
  title: 'shieldkit',
  titleTemplate: ':title · shieldkit docs',
  description:
    'shieldkit (npm) — production guardrails, structured output repair, and compliance for the Vercel AI SDK',
  base,
  srcDir: '../docs',
  outDir: '.vitepress/dist',
  cleanUrls: true,
  vite: {
    esbuild: {
      target: 'esnext',
    },
    build: {
      target: 'esnext',
    },
  },
  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'API', link: '/api/reference' },
      { text: 'Testing', link: '/testing/running-tests' },
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
    socialLinks: [{ icon: 'github', link: 'https://github.com/sakurablush/shieldkit' }],
    footer: {
      message: 'MIT Licensed · npm: shieldkit',
      copyright: 'shieldkit contributors',
    },
  },
});
