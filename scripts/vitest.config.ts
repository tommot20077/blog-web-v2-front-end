import { defineConfig } from 'vitest/config'

/**
 * Dedicated vitest config for the API-contract audit scripts.
 *
 * The root vitest.config.ts only includes `src/**` and depends on happy-dom +
 * Vue plugin. Audit scripts live under `scripts/` and run in node — they need
 * a minimal config of their own.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    globals: false,
    css: false,
    testTimeout: 30_000,
  },
})
