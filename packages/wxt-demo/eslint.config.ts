import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  {
    languageOptions: {
      globals: {
        ...autoImports.globals,
      },
      sourceType: 'module',
    },
  },
];
