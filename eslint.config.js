const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const globals = require('globals');
const prettierPlugin = require('eslint-plugin-prettier');
const nPlugin = require('eslint-plugin-n');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');
const importPlugin = require('eslint-plugin-import');
const tsParser = require('@typescript-eslint/parser');

// Helper function to clean up globals
const cleanGlobals = (globalsObj) => {
  const cleaned = {};
  for (const key in globalsObj) {
    cleaned[key.trim()] = globalsObj[key];
  }
  return cleaned;
};

// Clean and merge globals
const globalObjects = {
  ...cleanGlobals(globals.browser),
  ...cleanGlobals(globals.node),
  ...cleanGlobals(globals.jest),
};

module.exports = [
  js.configs.recommended,
  prettierConfig,
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
      prettier: prettierPlugin,
      n: nPlugin,
      'unused-imports': unusedImportsPlugin,
      import: importPlugin,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      globals: globalObjects,
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
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
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
      '@typescript-eslint/ban-ts-ignore': 'off',

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
