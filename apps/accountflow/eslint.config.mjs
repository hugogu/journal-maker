import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
    'css/no-at-rules': ['error', { ignoreAtRules: ['tailwind', 'apply', 'layer'] }],
  },
})
