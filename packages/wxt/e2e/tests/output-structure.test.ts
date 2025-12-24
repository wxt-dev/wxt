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
      'entrypoints/overlay.content.ts',
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
        body{font:100% Helvetica,sans-serif;color:#333}

        ================================================================================
        .output/chrome-mv3/assets/sass-one.css
        ----------------------------------------
        body{font:100% Helvetica,sans-serif;color:#333}

        ================================================================================
        .output/chrome-mv3/content-scripts/plain-two.css
        ----------------------------------------
        body{font:100% Helvetica,sans-serif;color:#333}

        ================================================================================
        .output/chrome-mv3/content-scripts/sass-two.css
        ----------------------------------------
        body{font:100% Helvetica,sans-serif;color:#333}

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
          import { l as logHello, i as initPlugins } from "./chunks/_virtual_wxt-plugins-OjKtWpmY.js";
          function defineBackground(arg) {
            if (arg == null || typeof arg === "function") return { main: arg };
            return arg;
          }
          const definition = defineBackground({
            type: "module",
            main() {
              logHello("background");
            }
          });
          globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
          function print(method, ...args) {
            return;
          }
          const logger = {
            debug: (...args) => print(console.debug, ...args),
            log: (...args) => print(console.log, ...args),
            warn: (...args) => print(console.warn, ...args),
            error: (...args) => print(console.error, ...args)
          };
          let result;
          try {
            initPlugins();
            result = definition.main();
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
          // Make output for snapshot readible
          minify: false,
        },
      }),
    });

    expect(await project.serializeFile('.output/chrome-mv3/background.js'))
      .toMatchInlineSnapshot(`
      ".output/chrome-mv3/background.js
      ----------------------------------------
      var background = (function() {
        "use strict";
        function defineBackground(arg) {
          if (arg == null || typeof arg === "function") return { main: arg };
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
        function initPlugins() {
        }
        globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
        function print(method, ...args) {
          return;
        }
        const logger = {
          debug: (...args) => print(console.debug, ...args),
          log: (...args) => print(console.log, ...args),
          warn: (...args) => print(console.warn, ...args),
          error: (...args) => print(console.error, ...args)
        };
        let result;
        try {
          initPlugins();
          result = definition.main();
          if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
        } catch (err) {
          logger.error("The background crashed on startup!");
          throw err;
        }
        var background_entrypoint_default = result;
        return background_entrypoint_default;
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

      await project.build();

      expect(
        await project.serializeFile(
          '.output/chrome-mv3/content-scripts/content.js',
        ),
      ).toMatchInlineSnapshot(`
          ".output/chrome-mv3/content-scripts/content.js
          ----------------------------------------
          var content=(function(){"use strict";function E(e){return e}const h={matches:["*://*/*"],main(){}};function s(e,...t){}const u={debug:(...e)=>s(console.debug,...e),log:(...e)=>s(console.log,...e),warn:(...e)=>s(console.warn,...e),error:(...e)=>s(console.error,...e)},l=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;var g=class d extends Event{static EVENT_NAME=a("wxt:locationchange");constructor(t,n){super(d.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function a(e){return\`\${l?.runtime?.id}:content:\${e}\`}function v(e){let t,n;return{run(){t==null&&(n=new URL(location.href),t=e.setInterval(()=>{let r=new URL(location.href);r.href!==n.href&&(window.dispatchEvent(new g(r,n)),n=r)},1e3))}}}var m=class c{static SCRIPT_STARTED_MESSAGE_TYPE=a("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=v(this);receivedMessageIds=new Set;constructor(t,n){this.contentScriptName=t,this.options=n,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return l.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,n){const r=setInterval(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearInterval(r)),r}setTimeout(t,n){const r=setTimeout(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearTimeout(r)),r}requestAnimationFrame(t){const n=requestAnimationFrame((...r)=>{this.isValid&&t(...r)});return this.onInvalidated(()=>cancelAnimationFrame(n)),n}requestIdleCallback(t,n){const r=requestIdleCallback((...i)=>{this.signal.aborted||t(...i)},n);return this.onInvalidated(()=>cancelIdleCallback(r)),r}addEventListener(t,n,r,i){n==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),t.addEventListener?.(n.startsWith("wxt:")?a(n):n,r,{...i,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),u.debug(\`Content script "\${this.contentScriptName}" context invalidated\`)}stopOldScripts(){window.postMessage({type:c.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){const n=t.data?.type===c.SCRIPT_STARTED_MESSAGE_TYPE,r=t.data?.contentScriptName===this.contentScriptName,i=!this.receivedMessageIds.has(t.data?.messageId);return n&&r&&i}listenForNewerScripts(t){let n=!0;const r=i=>{if(this.verifyScriptStartedEvent(i)){this.receivedMessageIds.add(i.data.messageId);const S=n;if(n=!1,S&&t?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",r),this.onInvalidated(()=>removeEventListener("message",r))}};function b(){}function o(e,...t){}const p={debug:(...e)=>o(console.debug,...e),log:(...e)=>o(console.log,...e),warn:(...e)=>o(console.warn,...e),error:(...e)=>o(console.error,...e)};var w=(async()=>{try{const{main:e,...t}=h;return await e(new m("content",t))}catch(e){throw p.error('The content script "content" crashed on startup!',e),e}})();return w})();
          content;"
        `);
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

      await project.build();

      expect(
        await project.serializeFile(
          '.output/chrome-mv3/content-scripts/content.js',
        ),
      ).toMatchInlineSnapshot(`
        ".output/chrome-mv3/content-scripts/content.js
        ----------------------------------------
        var MyContentScript=(function(){"use strict";function E(e){return e}const h={globalName:"MyContentScript",matches:["*://*/*"],main(){}};function s(e,...t){}const u={debug:(...e)=>s(console.debug,...e),log:(...e)=>s(console.log,...e),warn:(...e)=>s(console.warn,...e),error:(...e)=>s(console.error,...e)},l=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;var g=class d extends Event{static EVENT_NAME=a("wxt:locationchange");constructor(t,n){super(d.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function a(e){return\`\${l?.runtime?.id}:content:\${e}\`}function v(e){let t,n;return{run(){t==null&&(n=new URL(location.href),t=e.setInterval(()=>{let r=new URL(location.href);r.href!==n.href&&(window.dispatchEvent(new g(r,n)),n=r)},1e3))}}}var p=class c{static SCRIPT_STARTED_MESSAGE_TYPE=a("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=v(this);receivedMessageIds=new Set;constructor(t,n){this.contentScriptName=t,this.options=n,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return l.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,n){const r=setInterval(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearInterval(r)),r}setTimeout(t,n){const r=setTimeout(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearTimeout(r)),r}requestAnimationFrame(t){const n=requestAnimationFrame((...r)=>{this.isValid&&t(...r)});return this.onInvalidated(()=>cancelAnimationFrame(n)),n}requestIdleCallback(t,n){const r=requestIdleCallback((...i)=>{this.signal.aborted||t(...i)},n);return this.onInvalidated(()=>cancelIdleCallback(r)),r}addEventListener(t,n,r,i){n==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),t.addEventListener?.(n.startsWith("wxt:")?a(n):n,r,{...i,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),u.debug(\`Content script "\${this.contentScriptName}" context invalidated\`)}stopOldScripts(){window.postMessage({type:c.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){const n=t.data?.type===c.SCRIPT_STARTED_MESSAGE_TYPE,r=t.data?.contentScriptName===this.contentScriptName,i=!this.receivedMessageIds.has(t.data?.messageId);return n&&r&&i}listenForNewerScripts(t){let n=!0;const r=i=>{if(this.verifyScriptStartedEvent(i)){this.receivedMessageIds.add(i.data.messageId);const w=n;if(n=!1,w&&t?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",r),this.onInvalidated(()=>removeEventListener("message",r))}};function b(){}function o(e,...t){}const m={debug:(...e)=>o(console.debug,...e),log:(...e)=>o(console.log,...e),warn:(...e)=>o(console.warn,...e),error:(...e)=>o(console.error,...e)};var S=(async()=>{try{const{main:e,...t}=h;return await e(new p("content",t))}catch(e){throw m.error('The content script "content" crashed on startup!',e),e}})();return S})();
        MyContentScript;"
      `);
    });

    it('generates an IIFE with a variable name returned from a provided function', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.js',
        `export default defineContentScript({
          globalName: (entrypoint) => entrypoint.name + "_dynamic",
          matches: ["*://*/*"],
          main() {},
        })`,
      );

      await project.build();

      expect(
        await project.serializeFile(
          '.output/chrome-mv3/content-scripts/content.js',
        ),
      ).toMatchInlineSnapshot(`
        ".output/chrome-mv3/content-scripts/content.js
        ----------------------------------------
        var content_dynamic=(function(){"use strict";function E(e){return e}const h={globalName:e=>e.name+"_dynamic",matches:["*://*/*"],main(){}};function s(e,...t){}const u={debug:(...e)=>s(console.debug,...e),log:(...e)=>s(console.log,...e),warn:(...e)=>s(console.warn,...e),error:(...e)=>s(console.error,...e)},l=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;var g=class d extends Event{static EVENT_NAME=a("wxt:locationchange");constructor(t,n){super(d.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function a(e){return\`\${l?.runtime?.id}:content:\${e}\`}function v(e){let t,n;return{run(){t==null&&(n=new URL(location.href),t=e.setInterval(()=>{let r=new URL(location.href);r.href!==n.href&&(window.dispatchEvent(new g(r,n)),n=r)},1e3))}}}var m=class c{static SCRIPT_STARTED_MESSAGE_TYPE=a("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=v(this);receivedMessageIds=new Set;constructor(t,n){this.contentScriptName=t,this.options=n,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return l.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,n){const r=setInterval(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearInterval(r)),r}setTimeout(t,n){const r=setTimeout(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearTimeout(r)),r}requestAnimationFrame(t){const n=requestAnimationFrame((...r)=>{this.isValid&&t(...r)});return this.onInvalidated(()=>cancelAnimationFrame(n)),n}requestIdleCallback(t,n){const r=requestIdleCallback((...i)=>{this.signal.aborted||t(...i)},n);return this.onInvalidated(()=>cancelIdleCallback(r)),r}addEventListener(t,n,r,i){n==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),t.addEventListener?.(n.startsWith("wxt:")?a(n):n,r,{...i,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),u.debug(\`Content script "\${this.contentScriptName}" context invalidated\`)}stopOldScripts(){window.postMessage({type:c.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){const n=t.data?.type===c.SCRIPT_STARTED_MESSAGE_TYPE,r=t.data?.contentScriptName===this.contentScriptName,i=!this.receivedMessageIds.has(t.data?.messageId);return n&&r&&i}listenForNewerScripts(t){let n=!0;const r=i=>{if(this.verifyScriptStartedEvent(i)){this.receivedMessageIds.add(i.data.messageId);const S=n;if(n=!1,S&&t?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",r),this.onInvalidated(()=>removeEventListener("message",r))}};function b(){}function o(e,...t){}const p={debug:(...e)=>o(console.debug,...e),log:(...e)=>o(console.log,...e),warn:(...e)=>o(console.warn,...e),error:(...e)=>o(console.error,...e)};var w=(async()=>{try{const{main:e,...t}=h;return await e(new m("content",t))}catch(e){throw p.error('The content script "content" crashed on startup!',e),e}})();return w})();
        content_dynamic;"
      `);
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

      expect(
        await project.serializeFile(
          '.output/chrome-mv3/content-scripts/content.js',
        ),
      ).toMatchInlineSnapshot(`
        ".output/chrome-mv3/content-scripts/content.js
        ----------------------------------------
        (function() {
          "use strict";
          function defineContentScript(definition2) {
            return definition2;
          }
          const definition = defineContentScript({
            globalName: false,
            matches: ["*://*/*"],
            main() {
            }
          });
          function print$1(method, ...args) {
            return;
          }
          const logger$1 = {
            debug: (...args) => print$1(console.debug, ...args),
            log: (...args) => print$1(console.log, ...args),
            warn: (...args) => print$1(console.warn, ...args),
            error: (...args) => print$1(console.error, ...args)
          };
          const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
          const browser = browser$1;
          var WxtLocationChangeEvent = class WxtLocationChangeEvent2 extends Event {
            static EVENT_NAME = getUniqueEventName("wxt:locationchange");
            constructor(newUrl, oldUrl) {
              super(WxtLocationChangeEvent2.EVENT_NAME, {});
              this.newUrl = newUrl;
              this.oldUrl = oldUrl;
            }
          };
          function getUniqueEventName(eventName) {
            return \`\${browser?.runtime?.id}:\${"content"}:\${eventName}\`;
          }
          function createLocationWatcher(ctx) {
            let interval;
            let oldUrl;
            return { run() {
              if (interval != null) return;
              oldUrl = new URL(location.href);
              interval = ctx.setInterval(() => {
                let newUrl = new URL(location.href);
                if (newUrl.href !== oldUrl.href) {
                  window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
                  oldUrl = newUrl;
                }
              }, 1e3);
            } };
          }
          var ContentScriptContext = class ContentScriptContext2 {
            static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
            isTopFrame = window.self === window.top;
            abortController;
            locationWatcher = createLocationWatcher(this);
            receivedMessageIds = /* @__PURE__ */ new Set();
            constructor(contentScriptName, options) {
              this.contentScriptName = contentScriptName;
              this.options = options;
              this.abortController = new AbortController();
              if (this.isTopFrame) {
                this.listenForNewerScripts({ ignoreFirstEvent: true });
                this.stopOldScripts();
              } else this.listenForNewerScripts();
            }
            get signal() {
              return this.abortController.signal;
            }
            abort(reason) {
              return this.abortController.abort(reason);
            }
            get isInvalid() {
              if (browser.runtime.id == null) this.notifyInvalidated();
              return this.signal.aborted;
            }
            get isValid() {
              return !this.isInvalid;
            }
            /**
            * Add a listener that is called when the content script's context is invalidated.
            *
            * @returns A function to remove the listener.
            *
            * @example
            * browser.runtime.onMessage.addListener(cb);
            * const removeInvalidatedListener = ctx.onInvalidated(() => {
            *   browser.runtime.onMessage.removeListener(cb);
            * })
            * // ...
            * removeInvalidatedListener();
            */
            onInvalidated(cb) {
              this.signal.addEventListener("abort", cb);
              return () => this.signal.removeEventListener("abort", cb);
            }
            /**
            * Return a promise that never resolves. Useful if you have an async function that shouldn't run
            * after the context is expired.
            *
            * @example
            * const getValueFromStorage = async () => {
            *   if (ctx.isInvalid) return ctx.block();
            *
            *   // ...
            * }
            */
            block() {
              return new Promise(() => {
              });
            }
            /**
            * Wrapper around \`window.setInterval\` that automatically clears the interval when invalidated.
            *
            * Intervals can be cleared by calling the normal \`clearInterval\` function.
            */
            setInterval(handler, timeout) {
              const id = setInterval(() => {
                if (this.isValid) handler();
              }, timeout);
              this.onInvalidated(() => clearInterval(id));
              return id;
            }
            /**
            * Wrapper around \`window.setTimeout\` that automatically clears the interval when invalidated.
            *
            * Timeouts can be cleared by calling the normal \`setTimeout\` function.
            */
            setTimeout(handler, timeout) {
              const id = setTimeout(() => {
                if (this.isValid) handler();
              }, timeout);
              this.onInvalidated(() => clearTimeout(id));
              return id;
            }
            /**
            * Wrapper around \`window.requestAnimationFrame\` that automatically cancels the request when
            * invalidated.
            *
            * Callbacks can be canceled by calling the normal \`cancelAnimationFrame\` function.
            */
            requestAnimationFrame(callback) {
              const id = requestAnimationFrame((...args) => {
                if (this.isValid) callback(...args);
              });
              this.onInvalidated(() => cancelAnimationFrame(id));
              return id;
            }
            /**
            * Wrapper around \`window.requestIdleCallback\` that automatically cancels the request when
            * invalidated.
            *
            * Callbacks can be canceled by calling the normal \`cancelIdleCallback\` function.
            */
            requestIdleCallback(callback, options) {
              const id = requestIdleCallback((...args) => {
                if (!this.signal.aborted) callback(...args);
              }, options);
              this.onInvalidated(() => cancelIdleCallback(id));
              return id;
            }
            addEventListener(target, type, handler, options) {
              if (type === "wxt:locationchange") {
                if (this.isValid) this.locationWatcher.run();
              }
              target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
                ...options,
                signal: this.signal
              });
            }
            /**
            * @internal
            * Abort the abort controller and execute all \`onInvalidated\` listeners.
            */
            notifyInvalidated() {
              this.abort("Content script context invalidated");
              logger$1.debug(\`Content script "\${this.contentScriptName}" context invalidated\`);
            }
            stopOldScripts() {
              window.postMessage({
                type: ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE,
                contentScriptName: this.contentScriptName,
                messageId: Math.random().toString(36).slice(2)
              }, "*");
            }
            verifyScriptStartedEvent(event) {
              const isScriptStartedEvent = event.data?.type === ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE;
              const isSameContentScript = event.data?.contentScriptName === this.contentScriptName;
              const isNotDuplicate = !this.receivedMessageIds.has(event.data?.messageId);
              return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
            }
            listenForNewerScripts(options) {
              let isFirst = true;
              const cb = (event) => {
                if (this.verifyScriptStartedEvent(event)) {
                  this.receivedMessageIds.add(event.data.messageId);
                  const wasFirst = isFirst;
                  isFirst = false;
                  if (wasFirst && options?.ignoreFirstEvent) return;
                  this.notifyInvalidated();
                }
              };
              addEventListener("message", cb);
              this.onInvalidated(() => removeEventListener("message", cb));
            }
          };
          function initPlugins() {
          }
          function print(method, ...args) {
            return;
          }
          const logger = {
            debug: (...args) => print(console.debug, ...args),
            log: (...args) => print(console.log, ...args),
            warn: (...args) => print(console.warn, ...args),
            error: (...args) => print(console.error, ...args)
          };
          const result = (async () => {
            try {
              initPlugins();
              const { main, ...options } = definition;
              return await main(new ContentScriptContext("content", options));
            } catch (err) {
              logger.error(\`The content script "\${"content"}" crashed on startup!\`, err);
              throw err;
            }
          })();
          var content_script_isolated_world_entrypoint_default = result;
          return content_script_isolated_world_entrypoint_default;
        })();
        "
      `);
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

      await project.build();

      expect(
        await project.serializeFile(
          '.output/chrome-mv3/content-scripts/content.js',
        ),
      ).toMatchInlineSnapshot(`
        ".output/chrome-mv3/content-scripts/content.js
        ----------------------------------------
        (function(){"use strict";function f(e){return e}const h={globalName:!1,matches:["*://*/*"],main(){}};function s(e,...t){}const u={debug:(...e)=>s(console.debug,...e),log:(...e)=>s(console.log,...e),warn:(...e)=>s(console.warn,...e),error:(...e)=>s(console.error,...e)},c=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;var g=class d extends Event{static EVENT_NAME=a("wxt:locationchange");constructor(t,n){super(d.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function a(e){return\`\${c?.runtime?.id}:content:\${e}\`}function v(e){let t,n;return{run(){t==null&&(n=new URL(location.href),t=e.setInterval(()=>{let r=new URL(location.href);r.href!==n.href&&(window.dispatchEvent(new g(r,n)),n=r)},1e3))}}}var m=class l{static SCRIPT_STARTED_MESSAGE_TYPE=a("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=v(this);receivedMessageIds=new Set;constructor(t,n){this.contentScriptName=t,this.options=n,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return c.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,n){const r=setInterval(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearInterval(r)),r}setTimeout(t,n){const r=setTimeout(()=>{this.isValid&&t()},n);return this.onInvalidated(()=>clearTimeout(r)),r}requestAnimationFrame(t){const n=requestAnimationFrame((...r)=>{this.isValid&&t(...r)});return this.onInvalidated(()=>cancelAnimationFrame(n)),n}requestIdleCallback(t,n){const r=requestIdleCallback((...i)=>{this.signal.aborted||t(...i)},n);return this.onInvalidated(()=>cancelIdleCallback(r)),r}addEventListener(t,n,r,i){n==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),t.addEventListener?.(n.startsWith("wxt:")?a(n):n,r,{...i,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),u.debug(\`Content script "\${this.contentScriptName}" context invalidated\`)}stopOldScripts(){window.postMessage({type:l.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){const n=t.data?.type===l.SCRIPT_STARTED_MESSAGE_TYPE,r=t.data?.contentScriptName===this.contentScriptName,i=!this.receivedMessageIds.has(t.data?.messageId);return n&&r&&i}listenForNewerScripts(t){let n=!0;const r=i=>{if(this.verifyScriptStartedEvent(i)){this.receivedMessageIds.add(i.data.messageId);const S=n;if(n=!1,S&&t?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",r),this.onInvalidated(()=>removeEventListener("message",r))}};function b(){}function o(e,...t){}const p={debug:(...e)=>o(console.debug,...e),log:(...e)=>o(console.log,...e),warn:(...e)=>o(console.warn,...e),error:(...e)=>o(console.error,...e)};var w=(async()=>{try{const{main:e,...t}=h;return await e(new m("content",t))}catch(e){throw p.error('The content script "content" crashed on startup!',e),e}})();return w})();
        "
      `);
    });

    it('can be specified on unlisted scripts', async () => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/unlisted.js',
        `export default defineUnlistedScript({
          globalName: false,
          main() {}
        })`,
      );

      await project.build();

      expect(await project.serializeFile('.output/chrome-mv3/unlisted.js'))
        .toMatchInlineSnapshot(`
          ".output/chrome-mv3/unlisted.js
          ----------------------------------------
          (function(){"use strict";function i(t){return t==null||typeof t=="function"?{main:t}:t}const o=i({globalName:!1,main(){}});function l(){}function n(t,...r){}const e={debug:(...t)=>n(console.debug,...t),log:(...t)=>n(console.log,...t),warn:(...t)=>n(console.warn,...t),error:(...t)=>n(console.error,...t)};var s=(()=>{try{}catch(r){throw e.error('Failed to initialize plugins for "unlisted"',r),r}let t;try{t=o.main(),t instanceof Promise&&(t=t.catch(r=>{throw e.error('The unlisted script "unlisted" crashed on startup!',r),r}))}catch(r){throw e.error('The unlisted script "unlisted" crashed on startup!',r),r}return t})();return s})();
          "
        `);
    });
  });
});
