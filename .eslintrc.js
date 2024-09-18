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
  },
  root: true,
}

module.exports = eslint
