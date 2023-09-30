import { describe, expect, it } from 'vitest';
import { TestProject } from '../utils';

describe('React', () => {
  it('should prepare and build an project with a tsx entrypoint', async () => {
    const project = new TestProject({
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.14',
        '@types/react-dom': '^18.2.6',
      },
    });
    project.addFile(
      'entrypoints/demo.content.tsx',
      `import ReactDOM from 'react-dom/client';
      
      export default defineContentScript({
        matches: "<all_urls>",
        main() {
          const container = document.createElement("div");
          document.body.append(container)
          const root = ReactDOM.createRoot(container);
          root.render(<h1>Hello, world!</h1>);
        }
      })`,
    );

    await project.build();

    expect(
      await project.fileExists('.output/chrome-mv3/content-scripts/demo.js'),
    ).toBe(true);
    expect(await project.serializeFile('.output/chrome-mv3/manifest.json'))
      .toMatchInlineSnapshot(`
      ".output/chrome-mv3/manifest.json
      ----------------------------------------
      {\\"manifest_version\\":3,\\"name\\":\\"E2E Extension\\",\\"description\\":\\"Example description\\",\\"version\\":\\"0.0.0\\",\\"version_name\\":\\"0.0.0-test\\",\\"content_scripts\\":[{\\"matches\\":\\"<all_urls>\\",\\"js\\":[\\"content-scripts/demo.js\\"]}]}"
    `);
  });
});
