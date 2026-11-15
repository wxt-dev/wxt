// ESLint is only installed as a dev dependency to test WXT's ESLint integration
// (auto-imports). Linting is done with Oxlint, so only this file is checked.
export default [{ ignores: ['**/*', '!eslint.config.mjs'] }];
