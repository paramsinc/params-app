/** @type {import('eslint').Linter} */
const eslint = {
  extends: ['next', 'plugin:drizzle/all'],
  parser: '@typescript-eslint/parser',
  settings: {
    next: {
      rootDir: 'apps/next/',
    },
  },
  rules: {
    'drizzle/enforce-update-with-where': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'error',
  },
  root: true,
  plugins: ['drizzle'],
  parserOptions: {
    project: './tsconfig.json',
  },
}

module.exports = eslint
