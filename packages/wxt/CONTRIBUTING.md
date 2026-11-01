# Core WXT Package Contributing

## Directory Structure

```plaintext
📁 e2e/
    📁 tests/                      - Contains E2E tests using real projects
    📄 utils.ts                    - Utils for running E2E tests
📁 src/
    📁 cli/                        - Contains CLI entrypoint and commands
    📁 internal/                   - Contains any code that depends on the `wxt` context variable
        📄 wxt.ts                  - Defines the `wxt` context variable
    📁 internal-utils/             - Contains pure, simple helper functions
    📁 modules/                    - Contains public APIs for `wxt/modules` exports
    📁 testing/                    - Contains public APIs for `wxt/testing/*` exports
    📁 utils/                      - Contains public APIs for `wxt/utils/*` exports, there are runtime utils
    📁 virtual/                    - Contains virtual module templates, utils, and type definitions
    📄 vite-builder-env.d.ts       - Exported under `wxt/vite-builder-env`
    📄 index.ts                    - Contains public APIs for `wxt` exports
    📄 *.ts                        - Files exported by `index.ts` or are their own standalone exports at `wxt/*`
```

## Unit vs E2E Tests

When possible, always prefer to write unit tests over E2E tests. E2E tests are important, but they slow down CI.

If you're not sure if code should be validated with Unit or E2E tests, try writing unit tests first.
