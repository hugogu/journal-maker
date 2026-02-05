import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '../../tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.nuxt/**',
      '**/dist/**',
      '**/*.spec.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', // Exclude playwright specs
    ],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

