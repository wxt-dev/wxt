import autoImports from './.wxt/eslintrc-auto-import.js';

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
