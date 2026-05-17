import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    cache: true,
  },
  staged: {
    '*.{js,jsx,ts,tsx,vue}': ['vp lint --fix', 'vp fmt'],
    '*.{json,md,yml,yaml}': ['vp fmt'],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      '.output/**',
      'coverage/**',
      'dist/**',
      '.wxt/**',
      'docs/.vitepress/cache/**',
      'pnpm-lock.yaml',
      'CHANGELOG.md',
      'packages/browser/src/gen/**',
      'templates/**',
    ],
    overrides: [
      {
        files: ['**/*.test.ts'],
        rules: {
          //* Tests often have unbound methods, and it's not worth the effort to fix them
          '@typescript-eslint/unbound-method': 'off',
        },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    endOfLine: 'lf',
    printWidth: 80,
    sortPackageJson: false,
    jsdoc: true,
    ignorePatterns: [
      '.output',
      'coverage',
      'dist',
      '.wxt',
      'docs/.vitepress/cache',
      'pnpm-lock.yaml',
      'CHANGELOG.md',
      'packages/browser/src/gen',
    ],
  },
});
