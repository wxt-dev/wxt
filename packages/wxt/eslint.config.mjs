// ESLint is installed as a dev dependency because it's an optional peer for
// WXT, not because it should be used to lint this package. This file makes sure
// `@aklinker1/check` never errors out due to ESLint.
export default [{ ignores: ['**/*', '!eslint.config.mjs'] }];
