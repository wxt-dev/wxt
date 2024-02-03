import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe('Output Directory Structure', () => {
  it('should not output hidden files and directories that start with "."', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/.DS_Store');
    project.addFile('entrypoints/.hidden1/index.html');
    project.addFile('entrypoints/.hidden2.html');
    project.addFile('entrypoints/unlisted.html');

    await project.build();

    expect(await project.serializeOutput()).toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0"}
      ================================================================================
      .output/chrome-mv3/unlisted.html
      ----------------------------------------
      "
    `);
  });

  it('should output separate CSS files for each content script', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/one.content/index.ts',
      `import './style.css';
      export default defineContentScript({
        matches: ["*://*/*"],
        main: () => {},
      })`,
    );
    project.addFile(
      'entrypoints/one.content/style.css',
      `body { color: blue }`,
    );
    project.addFile(
      'entrypoints/two.content/index.ts',
      `import './style.css';
      export default defineContentScript({
        matches: ["*://*/*"],
        main: () => {},
      })`,
    );
    project.addFile('entrypoints/two.content/style.css', `body { color: red }`);

    await project.build();

    expect(
      await project.serializeOutput([
        '.output/chrome-mv3/content-scripts/one.js',
        '.output/chrome-mv3/content-scripts/two.js',
      ]),
    ).toMatchInlineSnapshot(`
      ".output/chrome-mv3/content-scripts/one.css
      ----------------------------------------
      body{color:#00f}

      ================================================================================
      .output/chrome-mv3/content-scripts/one.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/content-scripts/two.css
      ----------------------------------------
      body{color:red}

      ================================================================================
      .output/chrome-mv3/content-scripts/two.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["*://*/*"],"css":["content-scripts/one.css","content-scripts/two.css"],"js":["content-scripts/one.js","content-scripts/two.js"]}]}"
    `);
  });

  it('should allow inputs with invalid JS variable names, like dashes', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/overlay-one.content.ts',
      `export default defineContentScript({
        matches: ["*://*/*"],
        main: () => {},
      })`,
    );

    await project.build();

    expect(
      await project.serializeOutput([
        '.output/chrome-mv3/content-scripts/overlay-one.js',
      ]),
    ).toMatchInlineSnapshot(`
      ".output/chrome-mv3/content-scripts/overlay-one.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["*://*/*"],"js":["content-scripts/overlay-one.js"]}]}"
    `);
  });

  it('should not include an entrypoint if the target browser is not in the list of included targets', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/options.html', '<html></html>');
    project.addFile(
      'entrypoints/background.ts',
      `
          export default defineBackground({
            include: ["chrome"],
            main() {},
          })
        `,
    );

    await project.build({ browser: 'firefox' });

    expect(await project.fileExists('.output/firefox-mv2/background.js')).toBe(
      false,
    );
  });

  it('should not include an entrypoint if the target browser is in the list of excluded targets', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/options.html', '<html></html>');
    project.addFile(
      'entrypoints/background.ts',
      `
          export default defineBackground({
            exclude: ["chrome"],
            main() {},
          })
        `,
    );

    await project.build({ browser: 'chrome' });

    expect(await project.fileExists('.output/firefox-mv2/background.js')).toBe(
      false,
    );
  });

  it('should generate a stats file when analyzing the bundle', async () => {
    const project = new TestProject();
    project.setConfigFileConfig({
      analysis: {
        enabled: true,
        template: 'sunburst',
      },
    });
    project.addFile(
      'entrypoints/background.ts',
      `export default defineBackground(() => {});`,
    );
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile(
      'entrypoints/overlay.content.html',
      `export default defineContentScript({
        matches: [],
        main() {},
      });`,
    );

    await project.build();

    expect(await project.fileExists('stats.html')).toBe(true);
  });

  it('should support JavaScript entrypoints', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/background.js',
      `export default defineBackground(() => {});`,
    );
    project.addFile(
      'entrypoints/unlisted.js',
      `export default defineUnlistedScript(() => {})`,
    );
    project.addFile(
      'entrypoints/content.js',
      `export default defineContentScript({
        matches: ["*://*.google.com/*"],
        main() {},
      })`,
    );
    project.addFile(
      'entrypoints/named.content.jsx',
      `export default defineContentScript({
        matches: ["*://*.duckduckgo.com/*"],
        main() {},
      })`,
    );

    await project.build();

    expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/manifest.json
        ----------------------------------------
        {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","background":{"service_worker":"background.js"},"content_scripts":[{"matches":["*://*.google.com/*"],"js":["content-scripts/content.js"]},{"matches":["*://*.duckduckgo.com/*"],"js":["content-scripts/named.js"]}]}"
      `);
    expect(await project.fileExists('.output/chrome-mv3/background.js'));
    expect(
      await project.fileExists('.output/chrome-mv3/content-scripts/content.js'),
    );
    expect(
      await project.fileExists('.output/chrome-mv3/content-scripts/named.js'),
    );
    expect(await project.fileExists('.output/chrome-mv3/unlisted.js'));
  });

  it("should output to a custom directory when overriding 'outDir'", async () => {
    const project = new TestProject();
    project.addFile('entrypoints/unlisted.html');
    project.setConfigFileConfig({
      outDir: 'dist',
    });

    await project.build();

    expect(await project.fileExists('dist/chrome-mv3/manifest.json')).toBe(
      true,
    );
  });

  it('should generate ESM background script when type=module', async () => {
    const project = new TestProject();
    project.addFile(
      'utils/log.ts',
      `export function logHello(name: string) {
        console.log(\`Hello \${name}!\`);
      }`,
    );
    project.addFile(
      'entrypoints/background.ts',
      `export default defineBackground({
        type: "module",
        main() {
          logHello("background");
        },
      })`,
    );
    project.addFile(
      'entrypoints/popup/index.html',
      `<html>
        <head>
          <script type="module" src="./main.ts"></script>
        </head>
      </html>`,
    );
    project.addFile('entrypoints/popup/main.ts', `logHello('popup')`);

    await project.build({
      experimental: {
        // Simplify the build output for comparison
        includeBrowserPolyfill: false,
      },
      vite: () => ({
        build: {
          // Make output for snapshot readible
          minify: false,
        },
      }),
    });

    expect(await project.serializeFile('.output/chrome-mv3/background.js'))
      .toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      import { l as logHello } from "./chunks/log-bezs0tt4.js";
      function defineBackground(arg) {
        if (typeof arg === "function")
          return { main: arg };
        return arg;
      }
      const definition = defineBackground({
        type: "module",
        main() {
          logHello("background");
        }
      });
      chrome;
      function print(method, ...args) {
        return;
      }
      var logger = {
        debug: (...args) => print(console.debug, ...args),
        log: (...args) => print(console.log, ...args),
        warn: (...args) => print(console.warn, ...args),
        error: (...args) => print(console.error, ...args)
      };
      try {
        const res = definition.main();
        if (res instanceof Promise) {
          console.warn(
            "The background's main() function return a promise, but it must be synchonous"
          );
        }
      } catch (err) {
        logger.error("The background crashed on startup!");
        throw err;
      }
      "
    `);
  });

  it('should generate IIFE background script when type=undefined', async () => {
    const project = new TestProject();
    project.addFile(
      'utils/log.ts',
      `export function logHello(name: string) {
          console.log(\`Hello \${name}!\`);
        }`,
    );
    project.addFile(
      'entrypoints/background.ts',
      `export default defineBackground({
          main() {
            logHello("background");
          },
        })`,
    );
    project.addFile(
      'entrypoints/popup/index.html',
      `<html>
          <head>
            <script type="module" src="./main.ts"></script>
          </head>
        </html>`,
    );
    project.addFile('entrypoints/popup/main.ts', `logHello('popup')`);

    await project.build({
      experimental: {
        // Simplify the build output for comparison
        includeBrowserPolyfill: false,
      },
      vite: () => ({
        build: {
          // Make output for snapshot readible
          minify: false,
        },
      }),
    });

    expect(await project.serializeFile('.output/chrome-mv3/background.js'))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/background.js
        ----------------------------------------
        (function() {
          "use strict";
          function defineBackground(arg) {
            if (typeof arg === "function")
              return { main: arg };
            return arg;
          }
          function logHello(name) {
            console.log(\`Hello \${name}!\`);
          }
          const definition = defineBackground({
            main() {
              logHello("background");
            }
          });
          chrome;
          function print(method, ...args) {
            return;
          }
          var logger = {
            debug: (...args) => print(console.debug, ...args),
            log: (...args) => print(console.log, ...args),
            warn: (...args) => print(console.warn, ...args),
            error: (...args) => print(console.error, ...args)
          };
          try {
            const res = definition.main();
            if (res instanceof Promise) {
              console.warn(
                "The background's main() function return a promise, but it must be synchonous"
              );
            }
          } catch (err) {
            logger.error("The background crashed on startup!");
            throw err;
          }
        })();
        "
      `);
  });

  it('should generate ESM content script when type=module', async () => {
    const project = new TestProject();
    project.addFile(
      'utils/log.ts',
      `export function logHello(name: string) {
        console.log(\`Hello \${name}!\`);
      }`,
    );
    project.addFile(
      'entrypoints/content.ts',
      `export default defineContentScript({
        matches: ["<all_urls>"],
        type: "module",
        main() {
          logHello("background");
        },
      })`,
    );
    project.addFile(
      'entrypoints/popup/index.html',
      `<html>
        <head>
          <script type="module" src="./main.ts"></script>
        </head>
      </html>`,
    );
    project.addFile('entrypoints/popup/main.ts', `logHello('popup')`);

    await project.build({
      experimental: {
        // Simplify the build output for comparison
        includeBrowserPolyfill: false,
      },
      vite: () => ({
        build: {
          // Make output for snapshot readible
          minify: false,
        },
      }),
    });

    expect(
      await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      ),
    ).toMatchSnapshot();
    expect(
      await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content-loader.js',
      ),
    ).toMatchInlineSnapshot(`
      ".output/chrome-mv3/content-scripts/content-loader.js
      ----------------------------------------
      import(
        /* vite-ignore */
        chrome.runtime.getURL('/content-scripts/content.js')
      )
      "
    `);
  });

  it('should generate IIFE content script when type=undefined', async () => {
    const project = new TestProject();
    project.addFile(
      'utils/log.ts',
      `export function logHello(name: string) {
          console.log(\`Hello \${name}!\`);
        }`,
    );
    project.addFile(
      'entrypoints/content.ts',
      `export default defineContentScript({
          matches: ["<all_urls>"],
          main() {
            logHello("background");
          },
        })`,
    );
    project.addFile(
      'entrypoints/popup/index.html',
      `<html>
          <head>
            <script type="module" src="./main.ts"></script>
          </head>
        </html>`,
    );
    project.addFile('entrypoints/popup/main.ts', `logHello('popup')`);

    await project.build({
      experimental: {
        // Simplify the build output for comparison
        includeBrowserPolyfill: false,
      },
      vite: () => ({
        build: {
          // Make output for snapshot readible
          minify: false,
        },
      }),
    });

    expect(
      await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      ),
    ).toMatchSnapshot();
    expect(
      await project.fileExists(
        '.output/chrome-mv3/content-scripts/content-loader.js',
      ),
    ).toBe(false);
  });
});
