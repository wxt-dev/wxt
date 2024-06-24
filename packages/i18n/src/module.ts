import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import {
  generateChromeMessagesText,
  parseMessagesFile,
  generateDtsText,
} from './build';
import glob from 'fast-glob';
import { basename, extname, join } from 'node:path';

export default defineWxtModule({
  name: 'wxt-builtin-i18n',
  configKey: 'i18n',

  setup(wxt) {
    if (wxt.config.manifest.default_locale == null) {
      wxt.logger.info('`[i18n]` Skipped, no `default_locale` in manifest');
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

    wxt.hooks.hook('prepare:types', async (wxt, entries) => {
      const files = await getLocalizationFiles();

      await Promise.all(
        files.map(async ({ file, locale }) => {
          if (locale !== wxt.config.manifest.default_locale) return;

          const messages = await parseMessagesFile(file);
          entries.push({
            path: 'types/wxt-i18n.d.ts',
            text: generateDtsText(messages, 'WxtI18n'),
            tsReference: true,
          });
        }),
      );
    });

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
