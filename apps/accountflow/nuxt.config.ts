import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-02-01',
  devtools: { enabled: true },
  
  typescript: {
    strict: true,
  },

  srcDir: 'src/',

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [],

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiApiEndpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accountflow',
    mockAi: process.env.MOCK_AI === 'true',
    public: {
      appName: 'AccountFlow',
      appVersion: '0.1.0'
    }
  },

  nitro: {
    experimental: {
      asyncContext: true
    }
  }
})
