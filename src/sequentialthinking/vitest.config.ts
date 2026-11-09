import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    reporters: [
      'default',
      ...(process.env.GITHUB_ACTIONS === 'true' ? ['github-actions'] : []),
      '@mergifyio/vitest',
    ],
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['**/*.ts'],
      exclude: ['**/__tests__/**', '**/dist/**'],
    },
  },
});
