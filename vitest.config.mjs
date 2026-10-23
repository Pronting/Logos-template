import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['script/cms/__tests__/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      include: ['script/cms/**/*.mjs', 'script/cms/**/*.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
})
