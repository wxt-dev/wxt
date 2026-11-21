import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    // Same packages that used real Vitest on main (not `echo 'noop'`).
    projects: [
      'packages/{auto-icons,i18n,is-background,runner,storage,wxt,wxt-demo}/vite.config.ts',
    ],
  },
  run: {
    // Cache `vite.config.ts` tasks and package.json scripts so recursive
    // `vp run -r <script>` calls replay unchanged work locally and in CI.
    cache: {
      tasks: true,
      scripts: true,
    },
  },
  staged: {
    '*.{js,jsx,ts,tsx,vue}': [
      'vp lint --fix --no-error-on-unmatched-pattern',
      'vp fmt',
    ],
    '*.{json,md,yml,yaml}': ['vp fmt'],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      '.output/**',
      '.vitest/**',
      'coverage/**',
      'dist/**',
      '.wxt/**',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
      'docs/api/reference/**',
      'bun.lock',
      'pnpm-lock.yaml',
      'CHANGELOG.md',
      'packages/browser/src/gen/**',
      'packages/wxt/inline/**',
      'packages/wxt/src/internal-utils/virtual-modules.ts',
      'templates/**',
    ],
    overrides: [
      {
        files: ['**/*.test.ts'],
        rules: {
          //* Tests often have unbound methods, and it's not worth the effort to fix them
          '@typescript-eslint/unbound-method': 'off',
          'no-unused-vars': 'off',
        },
      },
    ],
    rules: {
      'unicorn/no-empty-file': 'off',
    },
  },
  fmt: {
    sortTailwindcss: true,
    sortImports: true,
    jsdoc: true,
    printWidth: 80,
    singleQuote: true,
    ignorePatterns: [
      '.output',
      '.vitest',
      'coverage',
      'dist',
      '.wxt',
      'docs/.vitepress/cache',
      'docs/.vitepress/dist',
      'docs/api/reference',
      'bun.lock',
      'pnpm-lock.yaml',
      'CHANGELOG.md',
      'packages/browser/src/gen',
      'packages/wxt/inline',
      'packages/wxt/src/internal-utils/virtual-modules.ts',
      'templates',
    ],
  },
});
