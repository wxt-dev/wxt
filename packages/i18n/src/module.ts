import 'wxt';
import { addImportAlias, defineWxtModule } from 'wxt/modules';
import {
  generateChromeMessagesText,
  parseMessagesFile,
  generateTypeText,
} from './build';
import glob from 'fast-glob';
import { basename, extname, join, resolve } from 'node:path';

export default defineWxtModule({
  name: 'wxt-builtin-i18n',
  configKey: 'i18n',
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

    // Create .wxt/i18n.ts

    const sourcePath = 'i18n.ts';

    wxt.hooks.hook('prepare:types', async (wxt, entries) => {
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
      entries.push({
        path: sourcePath,
        text: `import { createI18n } from '@wxt-dev/i18n';

${generateTypeText(messages)}
export const i18n = createI18n<WxtI18nStructure>();
`,
        tsReference: true,
      });
    });

    addImportAlias(wxt, '#i18n', resolve(wxt.config.wxtDir, sourcePath));

    // Generate _locales/.../messages.json files

    wxt.hooks.hook('build:publicAssets', async (_, assets) => {
      const files = await getLocalizationFiles();
      await Promise.all(
        files.map(async ({ file, locale }) => {
          const messages = await parseMessagesFile(file);
          assets.push({
            contents: generateChromeMessagesText(messages),
            relativeDest: join('_locales', locale, 'messages.json'),
          });
        }),
      );
    });
  },
});

export interface I18nModuleOptions {
  clientId: string;
}

declare module 'wxt' {
  export interface InlineConfig {
    i18n?: I18nModuleOptions;
  }
}
