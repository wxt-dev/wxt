import 'wxt';
import { addAlias, defineWxtModule } from 'wxt/modules';
import {
  generateChromeMessagesText,
  parseMessagesFile,
  generateTypeText,
} from './build';
import glob from 'fast-glob';
import { basename, extname, join, resolve } from 'node:path';
import { watch } from 'chokidar';
import { GeneratedPublicFile, WxtDirFileEntry } from 'wxt';
import { writeFile } from 'node:fs/promises';

export default defineWxtModule({
  name: '@wxt-dev/i18n',
  imports: [{ from: '#i18n', name: 'i18n' }],

  setup(wxt) {
    if (wxt.config.manifest.default_locale == null) {
      wxt.logger.warn(
        `\`[i18n]\` manifest.default_locale not set, \`@wxt-dev/i18n\` disabled.`,
      );
      return;
    }
    wxt.logger.info(
      '`[i18n]` Default locale: ' + wxt.config.manifest.default_locale,
    );

    const getLocalizationFiles = async () => {
      const files = await glob('locales/*', {
        cwd: wxt.config.srcDir,
        absolute: true,
      });
      return files.map((file) => ({
        file,
        locale: basename(file).replace(extname(file), ''),
      }));
    };

    const generateOutputJsonFiles = async (): Promise<
      GeneratedPublicFile[]
    > => {
      const files = await getLocalizationFiles();
      return await Promise.all(
        files.map(async ({ file, locale }) => {
          const messages = await parseMessagesFile(file);
          return {
            contents: generateChromeMessagesText(messages),
            relativeDest: join('_locales', locale, 'messages.json'),
          };
        }),
      );
    };

    const generateTypes = async (): Promise<WxtDirFileEntry> => {
      const files = await getLocalizationFiles();
      const defaultLocaleFile = files.find(
        ({ locale }) => locale === wxt.config.manifest.default_locale,
      )!;
      if (defaultLocaleFile == null) {
        throw Error(
          `\`[i18n]\` Required localization file does not exist: \`<srcDir>/locales/${wxt.config.manifest.default_locale}.{json|json5|yml|yaml|toml}\``,
        );
      }

      const messages = await parseMessagesFile(defaultLocaleFile.file);
      return {
        path: typesPath,
        text: generateTypeText(messages),
      };
    };

    const updateLocalizations = async (file: string): Promise<void> => {
      wxt.logger.info(
        `\`[i18n]\` Localization file changed: \`${basename(file)}\``,
      );

      // Regenerate files
      const [typesFile, jsonFiles] = await Promise.all([
        generateTypes(),
        generateOutputJsonFiles(),
      ]);

      // Write files to disk
      await Promise.all([
        writeFile(
          resolve(wxt.config.wxtDir, typesFile.path),
          typesFile.text,
          'utf8',
        ),
        ...jsonFiles.map((file) =>
          writeFile(
            resolve(wxt.config.outDir, file.relativeDest),
            file.contents,
            'utf8',
          ),
        ),
      ]);

      // TODO: Implement HMR instead of reloading extension. The reload is
      // fast, but it causes the popup to close, which I'd like to prevent.
      wxt.server?.reloadExtension();
      wxt.logger.success(`\`[i18n]\` Extension reloaded`);
    };

    // Create .wxt/i18n.ts

    const sourcePath = resolve(wxt.config.wxtDir, 'i18n/index.ts');
    const typesPath = resolve(wxt.config.wxtDir, 'i18n/structure.d.ts');

    wxt.hooks.hook('prepare:types', async (_, entries) => {
      entries.push({
        path: sourcePath,
        text: `import { createI18n } from '@wxt-dev/i18n';
import type { GeneratedI18nStructure } from './structure';

export const i18n = createI18n<GeneratedI18nStructure>();

export { GeneratedI18nStructure }
`,
      });
    });

    addAlias(wxt, '#i18n', sourcePath);

    // Generate separate declaration file containing types - this prevents
    // firing the dev server's default file watcher when updating the types,
    // which would cause a full rebuild and reload of the extension.

    wxt.hooks.hook('prepare:types', async (_, entries) => {
      entries.push(await generateTypes());
    });

    // Generate _locales/.../messages.json files

    wxt.hooks.hook('build:publicAssets', async (_, assets) => {
      const outFiles = await generateOutputJsonFiles();
      assets.push(...outFiles);
    });

    // Reload extension during development

    wxt.hooks.hookOnce('build:done', () => {
      const watcher = watch(resolve(wxt.config.srcDir, 'locales'));
      watcher.on('change', updateLocalizations);
    });
  },
});
