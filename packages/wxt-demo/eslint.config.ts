import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig([
  globalIgnores(['.output', '.wxt']),
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tseslint.parser },
  },
  autoImports,
  {
    ignores: ['.output/**'],
    languageOptions: {
      sourceType: 'module',
    },
  },
]);
