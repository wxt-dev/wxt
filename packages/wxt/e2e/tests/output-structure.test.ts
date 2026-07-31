import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('Output Directory Structure', () => {
  it('should not output hidden files and directories that start with "."', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/.DS_Store');
    project.addFile('entrypoints/.hidden1/index.html', '<html></html>');
    project.addFile('entrypoints/.hidden2.html', '<html></html>');
    project.addFile('entrypoints/unlisted.html', '<html></html>');

    await project.build();

    expect(await project.serializeOutput()).toMatchInlineSnapshot(`
      ".output/chrome-mv3/chunks/unlisted-P2Xu9kJm.js
      ----------------------------------------
      (function(){let e=document.createElement(\`link\`).relList;if(e&&e.supports&&e.supports(\`modulepreload\`))return;for(let e of document.querySelectorAll(\`link[rel="modulepreload"]\`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===\`childList\`)for(let e of t.addedNodes)e.tagName===\`LINK\`&&e.rel===\`modulepreload\`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===\`use-credentials\`?\`include\`:e.crossOrigin===\`anonymous\`?\`omit\`:\`same-origin\`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0"}
      ================================================================================
      .output/chrome-mv3/unlisted.html
      ----------------------------------------
      <html><head>  <script type="module" crossorigin src="/chunks/unlisted-P2Xu9kJm.js"></script>
      </head></html>"
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
      /*$vite$:1*/
      ================================================================================
      .output/chrome-mv3/content-scripts/one.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/content-scripts/two.css
      ----------------------------------------
      body{color:red}
      /*$vite$:1*/
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

  it('should route content script CSS with Rollup strict deprecations enabled', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/content.content/index.ts',
      `import './style.css';
      export default defineContentScript({
        matches: ["*://*/*"],
        main: () => {},
      })`,
    );
    project.addFile(
      'entrypoints/content.content/style.css',
      `body { color: purple }`,
    );

    await project.build();

    expect(
      await project.serializeOutput([
        '.output/chrome-mv3/content-scripts/content.js',
      ]),
    ).toMatchInlineSnapshot(`
      ".output/chrome-mv3/content-scripts/content.css
      ----------------------------------------
      body{color:purple}
      /*$vite$:1*/
      ================================================================================
      .output/chrome-mv3/content-scripts/content.js
      ----------------------------------------
      <contents-ignored>
      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0","content_scripts":[{"matches":["*://*/*"],"css":["content-scripts/content.css"],"js":["content-scripts/content.js"]}]}"
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

    expect(await project.pathExists('.output/firefox-mv2/background.js')).toBe(
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

    expect(await project.pathExists('.output/firefox-mv2/background.js')).toBe(
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
      'entrypoints/overlay.content.ts',
      `export default defineContentScript({
        matches: [],
        main() {},
      });`,
    );

    await project.build();

    expect(await project.pathExists('stats.html')).toBe(true);
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
    expect(await project.pathExists('.output/chrome-mv3/background.js'));
    expect(
      await project.pathExists('.output/chrome-mv3/content-scripts/content.js'),
    );
    expect(
      await project.pathExists('.output/chrome-mv3/content-scripts/named.js'),
    );
    expect(await project.pathExists('.output/chrome-mv3/unlisted.js'));
  });

  it('should support CSS entrypoints', async () => {
    const project = new TestProject();

    project.addFile(
      'entrypoints/plain-one.css',
      `body {
        font: 100% Helvetica, sans-serif;
        color: #333;
      }`,
    );

    project.addFile(
      'entrypoints/plain-two.content.css',
      `body {
        font: 100% Helvetica, sans-serif;
        color: #333;
      }`,
    );

    project.addFile(
      'entrypoints/sass-one.scss',
      `$font-stack: Helvetica, sans-serif;
      $primary-color: #333;

      body {
        font: 100% $font-stack;
        color: $primary-color;
      }`,
    );

    project.addFile(
      'entrypoints/sass-two.content.scss',
      `$font-stack: Helvetica, sans-serif;
      $primary-color: #333;

      body {
        font: 100% $font-stack;
        color: $primary-color;
      }`,
    );

    await project.build();

    expect(await project.serializeOutput(['.output/chrome-mv3/manifest.json']))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/assets/plain-one.css
        ----------------------------------------
        body{color:#333;font:100% Helvetica,sans-serif}

        ================================================================================
        .output/chrome-mv3/assets/sass-one.css
        ----------------------------------------
        body{color:#333;font:100% Helvetica,sans-serif}

        ================================================================================
        .output/chrome-mv3/content-scripts/plain-two.css
        ----------------------------------------
        body{color:#333;font:100% Helvetica,sans-serif}

        ================================================================================
        .output/chrome-mv3/content-scripts/sass-two.css
        ----------------------------------------
        body{color:#333;font:100% Helvetica,sans-serif}

        ================================================================================
        .output/chrome-mv3/manifest.json
        ----------------------------------------
        <contents-ignored>"
      `);
  });

  it("should output to a custom directory when overriding 'outDir'", async () => {
    const project = new TestProject();
    project.addFile('entrypoints/unlisted.html', '<html></html>');
    project.setConfigFileConfig({
      outDir: 'dist',
    });

    await project.build();

    expect(await project.pathExists('dist/chrome-mv3/manifest.json')).toBe(
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
      vite: () => ({
        build: {
          // Make output for the snapshot readable
          minify: false,
        },
      }),
    });

    expect(await project.serializeFile('.output/chrome-mv3/background.js'))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/background.js
        ----------------------------------------
        import { n as logHello } from "./chunks/_virtual_wxt-plugins-BdnAIYoG.js";
        function defineBackground(arg) {
        	if (arg == null || typeof arg === "function") return { main: arg };
        	return arg;
        }
        var background_default = defineBackground({
        	type: "module",
        	main() {
        		logHello("background");
        	}
        });
        globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        /** Wrapper around \`console\` with a "[wxt]" prefix */
        var logger = {
        	debug: (...args) => ([...args], void 0),
        	log: (...args) => ([...args], void 0),
        	warn: (...args) => ([...args], void 0),
        	error: (...args) => ([...args], void 0)
        };
        var result;
        try {
        	result = background_default.main();
        	if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
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
      vite: () => ({
        build: {
          // Make output for the snapshot readable
          minify: false,
        },
      }),
    });

    expect(await project.serializeFile('.output/chrome-mv3/background.js'))
      .toMatchInlineSnapshot(`
        ".output/chrome-mv3/background.js
        ----------------------------------------
        var background = (function() {
        	function defineBackground(arg) {
        		if (arg == null || typeof arg === "function") return { main: arg };
        		return arg;
        	}
        	function logHello(name) {
        		console.log(\`Hello \${name}!\`);
        	}
        	var background_default = defineBackground({ main() {
        		logHello("background");
        	} });
        	globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        	/** Wrapper around \`console\` with a "[wxt]" prefix */
        	var logger = {
        		debug: (...args) => ([...args], void 0),
        		log: (...args) => ([...args], void 0),
        		warn: (...args) => ([...args], void 0),
        		error: (...args) => ([...args], void 0)
        	};
        	var result;
        	try {
        		result = background_default.main();
        		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
        	} catch (err) {
        		logger.error("The background crashed on startup!");
        		throw err;
        	}
        	return result;
        })();
        "
      `);
  });

  describe('globalName option', () => {
    it('does not generate a IIFE return variable by default', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: false } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output.includes('var content = ')).toBe(false);
    });

    it('does generates the IIFE name based on the entrypoint name when true', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: true,
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: false } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output).toMatch(/^var content\s?=[\s\S]*^content;$/gm);
    });

    it('generates an IIFE with a specific name', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: "MyContentScript",
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: false } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output).toMatch(
        /^var MyContentScript =[\s\S]*^MyContentScript;$/gm,
      );
    });

    it('generates an IIFE with a specific name provided by a function', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: () => "MyContentScript",
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: false } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output).toMatch(
        /^var MyContentScript =[\s\S]*^MyContentScript;$/gm,
      );
    });

    it('generates an anonymous IIFE when not minified', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: false,
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: false } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output).toMatch(/^\(function\(\) {[\s\S]*^}\)\(\);$/gm);
    });

    it('generates an anonymous IIFE when minified', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: false,
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build({ vite: () => ({ build: { minify: true } }) });

      const output = await project.serializeFile(
        '.output/chrome-mv3/content-scripts/content.js',
      );
      expect(output).toMatch(/^\(function\(\){[\s\S]*}\)\(\);$/gm);
    });
  });
});
