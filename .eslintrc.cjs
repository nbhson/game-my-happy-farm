module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [],
  ignorePatterns: ['dist', 'legacy-vanilla', 'server'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // --- lỗi thật sự phải sửa ---
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-undef': 'off', // parser TS lo rồi
    'no-undef': 'off',
    // --- code style hiện hữu dùng nhiều pattern game (đừng phá, chỉ cảnh báo) ---
    'no-empty-pattern': 'warn',
    'no-fallthrough': 'error',
    'no-async-promise-executor': 'error',
    'require-atomic-updates': 'off', // pattern zustand getState/setState hay bị false positive
    'no-var': 'error',
    'prefer-const': ['warn', { destructuring: 'all' }],
    'eqeqeq': ['error', 'smart'],
    'no-implicit-coercion': ['error', { allow: ['!!', '+'] }],
  },
};
