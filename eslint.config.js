import js from '@eslint/js';

export default [
  js.configs.recommended,

  // Game source files — non-module scripts with browser globals
  // no-undef is off because globals span multiple files;
  // no-unused-vars only checks locals (top-level names are cross-file exports)
  {
    files: ['*.js'],
    ignores: ['eslint.config.js', 'vitest.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly',
        localStorage: 'readonly', location: 'readonly',
        console: 'readonly', Math: 'readonly', JSON: 'readonly',
        Object: 'readonly', Array: 'readonly', Set: 'readonly',
        Map: 'readonly', Promise: 'readonly', setTimeout: 'readonly',
        clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', requestAnimationFrame: 'readonly',
        HTMLElement: 'readonly', Event: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { vars: 'local', argsIgnorePattern: '^_' }],
      'no-redeclare': 'off',   // global declarations across files look like redeclarations
      'no-unreachable': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-undef': 'off',       // cross-file globals make this impractical
    },
  },

  // Test files — ES modules
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        describe: 'readonly', it: 'readonly', test: 'readonly',
        expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
    },
  },

  { ignores: ['node_modules/**'] },
];
