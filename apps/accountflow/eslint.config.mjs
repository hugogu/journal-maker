import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.nuxt/',
    '.output/',
    '.nitro/',
    '.data/',
    '.vscode/',
    '.idea/',
    '*.min.js',
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
    'css/no-at-rules': ['error', { ignoreAtRules: ['tailwind', 'apply', 'layer'] }],
  },
})
