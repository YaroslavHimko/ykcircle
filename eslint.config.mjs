import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'dist/**', '.verification-dist/**', 'plugins/**'] },
  {
    files: ['src/**/*.js', 'src/**/*.jsx', 'test/**/*.js', 'tools/**/*.js', 'eslint.config.mjs'],
    plugins: { react, 'react-hooks': reactHooks, import: importPlugin },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.mjs'] },
        alias: { map: [['@', './src']], extensions: ['.js', '.jsx'] },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...importPlugin.flatConfigs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-self-import': 'error',
      'import/extensions': ['error', 'ignorePackages', { js: 'always', jsx: 'always' }],
      'no-undef': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['test/**/*.js', 'tools/**/*.js', '**/*.test.js', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
];
