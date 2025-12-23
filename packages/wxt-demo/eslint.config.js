import autoImports from './.wxt/eslintrc-auto-import.json';

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
