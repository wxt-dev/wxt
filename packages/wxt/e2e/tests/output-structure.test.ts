import { describe, expect, it } from 'vite-plus/test';
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
      ".output/chrome-mv3/chunks/unlisted-DPbbfBKe.js
      ----------------------------------------
      (function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(e){if(e.ep)return;e.ep=!0;const r=s(e);fetch(e.href,r)}})();try{}catch(i){console.error("[wxt] Failed to initialize plugins",i)}

      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {"manifest_version":3,"name":"E2E Extension","description":"Example description","version":"0.0.0"}
      ================================================================================
      .output/chrome-mv3/unlisted.html
      ----------------------------------------
      <html><head>  <script type="module" crossorigin src="/chunks/unlisted-DPbbfBKe.js"></script>
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
        	".output/chrome-mv3/background.js
        	----------------------------------------
        	import { n as logHello } from "./chunks/_virtual_wxt-plugins-NCigJ1yo.js";
        	//#region dist/utils/define-background.mjs
        	function defineBackground(arg) {
        		if (arg == null || typeof arg === "function") return { main: arg };
        		return arg;
        	}
        	//#endregion
        	//#region e2e/dist/278905hal/entrypoints/background.ts
        	var background_default = defineBackground({
        		type: "module",
        		main() {
        			logHello("background");
        		}
        	});
        	globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        	//#endregion
        	//#region ../../node_modules/.bun/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
        	var _MatchPattern = class {
        		constructor(matchPattern) {
        			if (matchPattern === "<all_urls>") {
        				this.isAllUrls = true;
        				this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        				this.hostnameMatch = "*";
        				this.pathnameMatch = "*";
        			} else {
        				const groups = /(.*):\\/\\/(.*?)(\\/.*)/.exec(matchPattern);
        				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        				const [_, protocol, hostname, pathname] = groups;
        				validateProtocol(matchPattern, protocol);
        				validateHostname(matchPattern, hostname);
        				validatePathname(matchPattern, pathname);
        				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        				this.hostnameMatch = hostname;
        				this.pathnameMatch = pathname;
        			}
        		}
        		includes(url) {
        			if (this.isAllUrls) return true;
        			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
        			return !!this.protocolMatches.find((protocol) => {
        				if (protocol === "http") return this.isHttpMatch(u);
        				if (protocol === "https") return this.isHttpsMatch(u);
        				if (protocol === "file") return this.isFileMatch(u);
        				if (protocol === "ftp") return this.isFtpMatch(u);
        				if (protocol === "urn") return this.isUrnMatch(u);
        			});
        		}
        		isHttpMatch(url) {
        			return url.protocol === "http:" && this.isHostPathMatch(url);
        		}
        		isHttpsMatch(url) {
        			return url.protocol === "https:" && this.isHostPathMatch(url);
        		}
        		isHostPathMatch(url) {
        			if (!this.hostnameMatch || !this.pathnameMatch) return false;
        			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\\*\\./, ""))];
        			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
        			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
        		}
        		isFileMatch(url) {
        			throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
        		}
        		isFtpMatch(url) {
        			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
        		}
        		isUrnMatch(url) {
        			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
        		}
        		convertPatternToRegex(pattern) {
        			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\\\\*/g, ".*");
        			return RegExp(\`^\${starsReplaced}$\`);
        		}
        		escapeForRegex(string) {
        			return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
        		}
        	};
        	var MatchPattern = _MatchPattern;
        	MatchPattern.PROTOCOLS = [
        		"http",
        		"https",
        		"file",
        		"ftp",
        		"urn"
        	];
        	var InvalidMatchPattern = class extends Error {
        		constructor(matchPattern, reason) {
        			super(\`Invalid match pattern "\${matchPattern}": \${reason}\`);
        		}
        	};
        	function validateProtocol(matchPattern, protocol) {
        		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, \`\${protocol} not a valid protocol (\${MatchPattern.PROTOCOLS.join(", ")})\`);
        	}
        	function validateHostname(matchPattern, hostname) {
        		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, \`Hostname cannot include a port\`);
        		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, \`If using a wildcard (*), it must go at the start of the hostname\`);
        	}
        	function validatePathname(matchPattern, pathname) {}
        	//#endregion
        	//#region \\0virtual:wxt-background-entrypoint?/Users/timeraa/Developer/wxt-dev/wxt/packages/wxt/e2e/dist/278905hal/entrypoints/background.ts
        	function print(method, ...args) {}
        	/** Wrapper around \`console\` with a "[wxt]" prefix */
        	var logger = {
        		debug: (...args) => print(console.debug, ...args),
        		log: (...args) => print(console.log, ...args),
        		warn: (...args) => print(console.warn, ...args),
        		error: (...args) => print(console.error, ...args)
        	};
        	var result;
        	try {
        		result = background_default.main();
        		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
        	} catch (err) {
        		logger.error("The background crashed on startup!");
        		throw err;
        	}
        	//#endregion
        	"
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
        			import { n as logHello } from "./chunks/_virtual_wxt-plugins-5xlF28wR.js";
        			//#region dist/utils/define-background.mjs
        			function defineBackground(arg) {
        				if (arg == null || typeof arg === "function") return { main: arg };
        				return arg;
        			}
        			//#endregion
        			//#region e2e/dist/280j061tec/entrypoints/background.ts
        			var background_default = defineBackground({
        				type: "module",
        				main() {
        					logHello("background");
        				}
        			});
        			globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        			//#endregion
        			//#region ../../node_modules/.bun/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
        			var _MatchPattern = class {
        				constructor(matchPattern) {
        					if (matchPattern === "<all_urls>") {
        						this.isAllUrls = true;
        						this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        						this.hostnameMatch = "*";
        						this.pathnameMatch = "*";
        					} else {
        						const groups = /(.*):\\/\\/(.*?)(\\/.*)/.exec(matchPattern);
        						if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        						const [_, protocol, hostname, pathname] = groups;
        						validateProtocol(matchPattern, protocol);
        						validateHostname(matchPattern, hostname);
        						validatePathname(matchPattern, pathname);
        						this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        						this.hostnameMatch = hostname;
        						this.pathnameMatch = pathname;
        					}
        				}
        				includes(url) {
        					if (this.isAllUrls) return true;
        					const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
        					return !!this.protocolMatches.find((protocol) => {
        						if (protocol === "http") return this.isHttpMatch(u);
        						if (protocol === "https") return this.isHttpsMatch(u);
        						if (protocol === "file") return this.isFileMatch(u);
        						if (protocol === "ftp") return this.isFtpMatch(u);
        						if (protocol === "urn") return this.isUrnMatch(u);
        					});
        				}
        				isHttpMatch(url) {
        					return url.protocol === "http:" && this.isHostPathMatch(url);
        				}
        				isHttpsMatch(url) {
        					return url.protocol === "https:" && this.isHostPathMatch(url);
        				}
        				isHostPathMatch(url) {
        					if (!this.hostnameMatch || !this.pathnameMatch) return false;
        					const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\\*\\./, ""))];
        					const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
        					return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
        				}
        				isFileMatch(url) {
        					throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
        				}
        				isFtpMatch(url) {
        					throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
        				}
        				isUrnMatch(url) {
        					throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
        				}
        				convertPatternToRegex(pattern) {
        					const starsReplaced = this.escapeForRegex(pattern).replace(/\\\\\\*/g, ".*");
        					return RegExp(\`^\${starsReplaced}$\`);
        				}
        				escapeForRegex(string) {
        					return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
        				}
        			};
        			var MatchPattern = _MatchPattern;
        			MatchPattern.PROTOCOLS = [
        				"http",
        				"https",
        				"file",
        				"ftp",
        				"urn"
        			];
        			var InvalidMatchPattern = class extends Error {
        				constructor(matchPattern, reason) {
        					super(\`Invalid match pattern "\${matchPattern}": \${reason}\`);
        				}
        			};
        			function validateProtocol(matchPattern, protocol) {
        				if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, \`\${protocol} not a valid protocol (\${MatchPattern.PROTOCOLS.join(", ")})\`);
        			}
        			function validateHostname(matchPattern, hostname) {
        				if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, \`Hostname cannot include a port\`);
        				if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, \`If using a wildcard (*), it must go at the start of the hostname\`);
        			}
        			function validatePathname(matchPattern, pathname) {}
        			//#endregion
        			//#region \\0virtual:wxt-background-entrypoint?/Users/timeraa/Developer/wxt-dev/wxt/packages/wxt/e2e/dist/280j061tec/entrypoints/background.ts
        			function print(method, ...args) {}
        			/** Wrapper around \`console\` with a "[wxt]" prefix */
        			var logger = {
        				debug: (...args) => print(console.debug, ...args),
        				log: (...args) => print(console.log, ...args),
        				warn: (...args) => print(console.warn, ...args),
        				error: (...args) => print(console.error, ...args)
        			};
        			var result;
        			try {
        				result = background_default.main();
        				if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
        			} catch (err) {
        				logger.error("The background crashed on startup!");
        				throw err;
        			}
        			//#endregion
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
        								//#region dist/utils/define-background.mjs
        								function defineBackground(arg) {
        									if (arg == null || typeof arg === "function") return { main: arg };
        									return arg;
        								}
        								//#endregion
        								//#region e2e/dist/bnj87iiki4/utils/log.ts
        								function logHello(name) {
        									console.log(\`Hello \${name}!\`);
        								}
        								//#endregion
        								//#region e2e/dist/bnj87iiki4/entrypoints/background.ts
        								var background_default = defineBackground({ main() {
        									logHello("background");
        								} });
        								globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        								//#endregion
        								//#region ../../node_modules/.bun/@webext-core+match-patterns@1.0.3/node_modules/@webext-core/match-patterns/lib/index.js
        								var _MatchPattern = class {
        									constructor(matchPattern) {
        										if (matchPattern === "<all_urls>") {
        											this.isAllUrls = true;
        											this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        											this.hostnameMatch = "*";
        											this.pathnameMatch = "*";
        										} else {
        											const groups = /(.*):\\/\\/(.*?)(\\/.*)/.exec(matchPattern);
        											if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        											const [_, protocol, hostname, pathname] = groups;
        											validateProtocol(matchPattern, protocol);
        											validateHostname(matchPattern, hostname);
        											validatePathname(matchPattern, pathname);
        											this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        											this.hostnameMatch = hostname;
        											this.pathnameMatch = pathname;
        										}
        									}
        									includes(url) {
        										if (this.isAllUrls) return true;
        										const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
        										return !!this.protocolMatches.find((protocol) => {
        											if (protocol === "http") return this.isHttpMatch(u);
        											if (protocol === "https") return this.isHttpsMatch(u);
        											if (protocol === "file") return this.isFileMatch(u);
        											if (protocol === "ftp") return this.isFtpMatch(u);
        											if (protocol === "urn") return this.isUrnMatch(u);
        										});
        									}
        									isHttpMatch(url) {
        										return url.protocol === "http:" && this.isHostPathMatch(url);
        									}
        									isHttpsMatch(url) {
        										return url.protocol === "https:" && this.isHostPathMatch(url);
        									}
        									isHostPathMatch(url) {
        										if (!this.hostnameMatch || !this.pathnameMatch) return false;
        										const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\\*\\./, ""))];
        										const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
        										return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
        									}
        									isFileMatch(url) {
        										throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
        									}
        									isFtpMatch(url) {
        										throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
        									}
        									isUrnMatch(url) {
        										throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
        									}
        									convertPatternToRegex(pattern) {
        										const starsReplaced = this.escapeForRegex(pattern).replace(/\\\\\\*/g, ".*");
        										return RegExp(\`^\${starsReplaced}$\`);
        									}
        									escapeForRegex(string) {
        										return string.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
        									}
        								};
        								var MatchPattern = _MatchPattern;
        								MatchPattern.PROTOCOLS = [
        									"http",
        									"https",
        									"file",
        									"ftp",
        									"urn"
        								];
        								var InvalidMatchPattern = class extends Error {
        									constructor(matchPattern, reason) {
        										super(\`Invalid match pattern "\${matchPattern}": \${reason}\`);
        									}
        								};
        								function validateProtocol(matchPattern, protocol) {
        									if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, \`\${protocol} not a valid protocol (\${MatchPattern.PROTOCOLS.join(", ")})\`);
        								}
        								function validateHostname(matchPattern, hostname) {
        									if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, \`Hostname cannot include a port\`);
        									if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, \`If using a wildcard (*), it must go at the start of the hostname\`);
        								}
        								function validatePathname(matchPattern, pathname) {}
        								//#endregion
        								//#region \\0virtual:wxt-background-entrypoint?/Users/timeraa/Developer/wxt-dev/wxt/packages/wxt/e2e/dist/bnj87iiki4/entrypoints/background.ts
        								function print(method, ...args) {}
        								/** Wrapper around \`console\` with a "[wxt]" prefix */
        								var logger = {
        									debug: (...args) => print(console.debug, ...args),
        									log: (...args) => print(console.log, ...args),
        									warn: (...args) => print(console.warn, ...args),
        									error: (...args) => print(console.error, ...args)
        								};
        								var result;
        								try {
        									result = background_default.main();
        									if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
        								} catch (err) {
        									logger.error("The background crashed on startup!");
        									throw err;
        								}
        								//#endregion
        								return result;
        							})();
        							"
        						`);
  });

  describe('globalName option', () => {
    it('generates an IIFE with a default name', async () => {
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
