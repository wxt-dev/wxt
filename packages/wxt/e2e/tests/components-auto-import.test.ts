import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { TestProject, WXT_PACKAGE_DIR } from '../utils';

const MODULE_VUE_SRC = resolve(
  WXT_PACKAGE_DIR,
  '../module-vue/modules/vue.ts',
).replace(/\\/g, '/');

const MODULE_REACT_SRC = resolve(
  WXT_PACKAGE_DIR,
  '../module-react/modules/react.ts',
).replace(/\\/g, '/');

const MODULE_SVELTE_SRC = resolve(
  WXT_PACKAGE_DIR,
  '../module-svelte/modules/svelte.ts',
).replace(/\\/g, '/');

const MODULE_SOLID_SRC = resolve(
  WXT_PACKAGE_DIR,
  '../module-solid/modules/solid.ts',
).replace(/\\/g, '/');

describe('Component Auto Imports', () => {
  describe('Vue', () => {
    it('should auto-import flat .vue SFC from the components/ directory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/vue-actual.ts',
        `export { default } from '${MODULE_VUE_SRC}';`,
      );
      project.addFile(
        'components/MyButton.vue',
        [
          '<template><button>Click me</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'MyButton',
      );
    });

    it('should auto-import nested .vue SFC from a subdirectory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/vue-actual.ts',
        `export { default } from '${MODULE_VUE_SRC}';`,
      );
      project.addFile(
        'components/deep/DeepButton.vue',
        [
          '<template><button>Deep</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'DeepButton',
      );
    });

    it('should auto-import both flat and nested .vue SFCs simultaneously', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/vue-actual.ts',
        `export { default } from '${MODULE_VUE_SRC}';`,
      );
      project.addFile(
        'components/MyButton.vue',
        [
          '<template><button>Flat</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );
      project.addFile(
        'components/deep/DeepButton.vue',
        [
          '<template><button>Deep</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );

      await project.prepare();

      const importsContent = await project.serializeFile(
        '.wxt/types/imports.d.ts',
      );
      expect(importsContent).toContain('MyButton');
      expect(importsContent).toContain('DeepButton');
    });

    it('should not generate imports.d.ts when imports is disabled', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/vue-actual.ts',
        `export { default } from '${MODULE_VUE_SRC}';`,
      );
      project.addFile(
        'components/MyButton.vue',
        [
          '<template><button>Click me</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );

      await project.prepare({ imports: false });

      expect(await project.pathExists('.wxt/types/imports.d.ts')).toBe(false);
    });

    it('flat filePatterns *.vue should NOT match nested components', async () => {
      // Regression guard: documents the bug that existed before the fix.
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/vue-flat.ts',
        `
          import { defineWxtModule } from 'wxt/modules';
          export default defineWxtModule({
            setup(wxt) {
              wxt.hook('config:resolved', (wxt) => {
                if (!wxt.config.imports) return;
                wxt.config.imports.dirsScanOptions ??= {};
                wxt.config.imports.dirsScanOptions.filePatterns = [
                  '*.{ts,js,mjs,cjs,mts,cts,vue}',
                ];
              });
            },
          });
        `,
      );
      project.addFile(
        'components/deep/DeepButton.vue',
        [
          '<template><button>Deep</button></template>',
          '<script>',
          'export default {};',
          '</script>',
        ].join('\n'),
      );

      await project.prepare();

      expect(
        await project.serializeFile('.wxt/types/imports.d.ts'),
      ).not.toContain('DeepButton');
    });
  });

  describe('React', () => {
    it('should auto-import flat components from the components/ directory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/react-actual.ts',
        `export { default } from '${MODULE_REACT_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'MyButton',
      );
    });

    it('should auto-import nested components from subdirectories', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/react-actual.ts',
        `export { default } from '${MODULE_REACT_SRC}';`,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'DeepButton',
      );
    });

    it('should auto-import both flat and nested components simultaneously', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/react-actual.ts',
        `export { default } from '${MODULE_REACT_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      const importsContent = await project.serializeFile(
        '.wxt/types/imports.d.ts',
      );
      expect(importsContent).toContain('MyButton');
      expect(importsContent).toContain('DeepButton');
    });

    it('should not generate imports.d.ts when imports is disabled', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/react-actual.ts',
        `export { default } from '${MODULE_REACT_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );

      await project.prepare({ imports: false });

      expect(await project.pathExists('.wxt/types/imports.d.ts')).toBe(false);
    });

    it('flat filePatterns *.ts should NOT match nested components', async () => {
      // Regression guard: documents the bug that existed before the fix.
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/react-flat.ts',
        `
          import { defineWxtModule } from 'wxt/modules';
          export default defineWxtModule({
            setup(wxt) {
              wxt.hook('config:resolved', (wxt) => {
                if (!wxt.config.imports) return;
                wxt.config.imports.dirsScanOptions ??= {};
                wxt.config.imports.dirsScanOptions.filePatterns = [
                  '*.{ts,js,mjs,cjs,mts,cts,jsx,tsx}',
                ];
              });
            },
          });
        `,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      expect(
        await project.serializeFile('.wxt/types/imports.d.ts'),
      ).not.toContain('DeepButton');
    });
  });

  describe('Svelte', () => {
    it('should auto-import flat .svelte SFC from the components/ directory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/svelte-actual.ts',
        `export { default } from '${MODULE_SVELTE_SRC}';`,
      );
      project.addFile(
        'components/MyWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Hello</p>'].join(
          '\n',
        ),
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'MyWidget',
      );
    });

    it('should auto-import nested .svelte SFC from a subdirectory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/svelte-actual.ts',
        `export { default } from '${MODULE_SVELTE_SRC}';`,
      );
      project.addFile(
        'components/ui/DeepWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Deep</p>'].join(
          '\n',
        ),
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'DeepWidget',
      );
    });

    it('should auto-import both flat and nested .svelte SFCs simultaneously', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/svelte-actual.ts',
        `export { default } from '${MODULE_SVELTE_SRC}';`,
      );
      project.addFile(
        'components/MyWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Hello</p>'].join(
          '\n',
        ),
      );
      project.addFile(
        'components/ui/DeepWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Deep</p>'].join(
          '\n',
        ),
      );

      await project.prepare();

      const importsContent = await project.serializeFile(
        '.wxt/types/imports.d.ts',
      );
      expect(importsContent).toContain('MyWidget');
      expect(importsContent).toContain('DeepWidget');
    });

    it('should not generate imports.d.ts when imports is disabled', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/svelte-actual.ts',
        `export { default } from '${MODULE_SVELTE_SRC}';`,
      );
      project.addFile(
        'components/MyWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Hello</p>'].join(
          '\n',
        ),
      );

      await project.prepare({ imports: false });

      expect(await project.pathExists('.wxt/types/imports.d.ts')).toBe(false);
    });

    it('flat filePatterns *.svelte should NOT match nested components', async () => {
      // Regression guard: documents the bug that existed before the fix.
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/svelte-flat.ts',
        `
          import { defineWxtModule } from 'wxt/modules';
          export default defineWxtModule({
            setup(wxt) {
              wxt.hook('config:resolved', (wxt) => {
                if (!wxt.config.imports) return;
                wxt.config.imports.dirsScanOptions ??= {};
                wxt.config.imports.dirsScanOptions.filePatterns = [
                  '*.{ts,js,mjs,cjs,mts,cts,svelte}',
                ];
              });
            },
          });
        `,
      );
      project.addFile(
        'components/ui/DeepWidget.svelte',
        ['<script>', 'export default {};', '</script>', '<p>Deep</p>'].join(
          '\n',
        ),
      );

      await project.prepare();

      expect(
        await project.serializeFile('.wxt/types/imports.d.ts'),
      ).not.toContain('DeepWidget');
    });
  });

  describe('Solid', () => {
    it('should auto-import flat components from the components/ directory', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/solid-actual.ts',
        `export { default } from '${MODULE_SOLID_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'MyButton',
      );
    });

    it('should auto-import nested components from subdirectories', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/solid-actual.ts',
        `export { default } from '${MODULE_SOLID_SRC}';`,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      expect(await project.serializeFile('.wxt/types/imports.d.ts')).toContain(
        'DeepButton',
      );
    });

    it('should auto-import both flat and nested components simultaneously', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/solid-actual.ts',
        `export { default } from '${MODULE_SOLID_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      const importsContent = await project.serializeFile(
        '.wxt/types/imports.d.ts',
      );
      expect(importsContent).toContain('MyButton');
      expect(importsContent).toContain('DeepButton');
    });

    it('should not generate imports.d.ts when imports is disabled', async () => {
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/solid-actual.ts',
        `export { default } from '${MODULE_SOLID_SRC}';`,
      );
      project.addFile(
        'components/MyButton.ts',
        `export function MyButton() {}`,
      );

      await project.prepare({ imports: false });

      expect(await project.pathExists('.wxt/types/imports.d.ts')).toBe(false);
    });

    it('flat filePatterns *.ts should NOT match nested components', async () => {
      // Regression guard: documents the bug that existed before the fix.
      const project = new TestProject();
      project.addFile('entrypoints/popup.html', `<html></html>`);
      project.addFile(
        'modules/solid-flat.ts',
        `
          import { defineWxtModule } from 'wxt/modules';
          export default defineWxtModule({
            setup(wxt) {
              wxt.hook('config:resolved', (wxt) => {
                if (!wxt.config.imports) return;
                wxt.config.imports.dirsScanOptions ??= {};
                wxt.config.imports.dirsScanOptions.filePatterns = [
                  '*.{ts,js,mjs,cjs,mts,cts,jsx,tsx}',
                ];
              });
            },
          });
        `,
      );
      project.addFile(
        'components/deep/DeepButton.ts',
        `export function DeepButton() {}`,
      );

      await project.prepare();

      expect(
        await project.serializeFile('.wxt/types/imports.d.ts'),
      ).not.toContain('DeepButton');
    });
  });
});
