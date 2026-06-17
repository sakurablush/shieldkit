import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
