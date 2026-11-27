// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import autoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig([
  globalIgnores(['.output', '.wxt']),
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tseslint.parser },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: false,
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  autoImports,
  {
    ignores: ['.output/**'],
    languageOptions: {
      sourceType: 'module',
    },
  },
]);
