import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe('Output Directory Structure', () => {
  it('should not output hidden files and directories that start with "."', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/.DS_Store');
    project.addFile('entrypoints/.hidden1/index.html');
    project.addFile('entrypoints/.hidden2.html');

    await project.build();

    expect(await project.serializeOutput()).toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\"}"
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

    expect(await project.serializeOutput()).toMatchInlineSnapshot(`
      ".output/chrome-mv3/assets/one.css
      ----------------------------------------
      body{color:#00f}

      ================================================================================
      .output/chrome-mv3/assets/two.css
      ----------------------------------------
      body{color:red}

      ================================================================================
      .output/chrome-mv3/content-scripts/one.js
      ----------------------------------------
      (function(){\\"use strict\\";function i(n){return n}const s=\\"\\",o={matches:[\\"*://*/*\\"],main:()=>{}};function t(n,...e){if(typeof e[0]==\\"string\\"){const c=e.shift();n(\`[wxt] \${c}\`,...e)}else n(\\"[wxt]\\",...e)}var r={debug:(...n)=>t(console.debug,...n),log:(...n)=>t(console.log,...n),warn:(...n)=>t(console.warn,...n),error:(...n)=>t(console.error,...n)};(async()=>{try{await o.main()}catch(n){r.error(\\"The content script crashed on startup!\\",n)}})()})();

      ================================================================================
      .output/chrome-mv3/content-scripts/two.js
      ----------------------------------------
      (function(){\\"use strict\\";function i(n){return n}const s=\\"\\",o={matches:[\\"*://*/*\\"],main:()=>{}};function t(n,...e){if(typeof e[0]==\\"string\\"){const c=e.shift();n(\`[wxt] \${c}\`,...e)}else n(\\"[wxt]\\",...e)}var r={debug:(...n)=>t(console.debug,...n),log:(...n)=>t(console.log,...n),warn:(...n)=>t(console.warn,...n),error:(...n)=>t(console.error,...n)};(async()=>{try{await o.main()}catch(n){r.error(\\"The content script crashed on startup!\\",n)}})()})();

      ================================================================================
      .output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":[\\"*://*/*\\"],\\"css\\":[\\"assets/one.css\\",\\"assets/two.css\\"],\\"js\\":[\\"content-scripts/one.js\\",\\"content-scripts/two.js\\"]}]}"
    `);
  });
});
