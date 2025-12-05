import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.spec.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
      include: ['src/**/*.{ts,vue}'],
      all: true,
    },
  }
})
