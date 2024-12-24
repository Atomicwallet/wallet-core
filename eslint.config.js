const jsConfig = require('@eslint/js').configs.recommended;
const prettierConfig = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const globalsModule = require('globals');

const globalObjects = Object.assign(
  {},
  globalsModule.browser,
  globalsModule.node,
  globalsModule.jest,
);

module.exports = [
  // Include the recommended JavaScript config
  jsConfig,

  // Include Prettier config
  prettierConfig,

  // Base settings and plugins
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
      n: require('eslint-plugin-n'),
      'unused-imports': require('eslint-plugin-unused-imports'),
      import: require('eslint-plugin-import'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    languageOptions: {
      globals: globalObjects, // Use languageOptions.globals instead of globals
    },
  },

  // Overrides for JavaScript files
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'import/no-unresolved': 'error',
      'prettier/prettier': 'error',
      'n/no-missing-import': 'warn',
    },
  },

  // Overrides for TypeScript files
  {
    files: ['**/*.ts'],
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      project: './tsconfig.json',
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,

      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-inferrable-types': 'warn',

      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',

      'unused-imports/no-unused-imports': 'error',

      'prettier/prettier': 'error',
    },
  },
];
