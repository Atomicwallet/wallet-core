import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

const settings = {
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: './tsconfig.json',
    },
  },
};

const plugins = {
  prettier: prettierPlugin,
  n: nodePlugin,
  'unused-imports': unusedImportsPlugin,
  import: importPlugin,
};

const globalObjects = {
  ...globals.browser,
  ...globals.node,
  ...globals.jest,
};

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins,
    settings,
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'import/no-unresolved': 'error',
      'prettier/prettier': 'error',
      'n/no-missing-import': 'warn',
    },
    languageOptions: {
      globals: globalObjects,
    },
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: globalObjects,
    },
    plugins: {
      ...plugins,
      '@typescript-eslint': tsPlugin,
    },
    settings,
    rules: {
      ...tsPlugin.configs['recommended'].rules,
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

  prettierConfig,
];
