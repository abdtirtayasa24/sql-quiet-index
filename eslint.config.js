import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import lit from 'eslint-plugin-lit';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'graphify-out/**',
      'public/content/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.ts'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      lit.configs['flat/recommended'],
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.tools.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: ['lit/directives/unsafe-html*'] },
      ],
    },
  },
  {
    files: ['src/app/**/*.ts', 'src/components/**/*.ts', 'src/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'lit/directives/unsafe-html*',
            '@electric-sql/pglite',
            '@electric-sql/pglite/*',
            'libpg-query',
          ],
        },
      ],
    },
  },
]);
