import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...autoImports.globals,
      },
      sourceType: 'module',
    },
  },
];
