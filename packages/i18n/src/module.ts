import 'wxt';
import { defineWxtModule } from 'wxt/modules';
import {
  generateDtsFile,
  generateChromeMessagesText,
  parseMessagesFile,
  generateChromeMessagesFile,
} from './build';
import glob from 'fast-glob';
import { basename, extname, resolve, join } from 'node:path';

export default defineWxtModule({
  name: 'wxt-builtin-i18n',
  configKey: 'i18n',

  setup(wxt) {
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

    wxt.hooks.hook('prepare:types', async (wxt) => {
      const files = await getLocalizationFiles();
      const outputFiles = await Promise.all(
        files.map(async ({ file, locale }) => ({
          path: resolve(wxt.config.outDir, '_locales', locale, 'messages.json'),
          text: generateChromeMessagesText(await parseMessagesFile(file)),
        })),
      );
    });

    wxt.hooks.hook('build:publicAssets', async (wxt, assets) => {
      const files = await getLocalizationFiles();
      await Promise.all(
        files.map(async ({ file, locale }) => {
          const messages = await parseMessagesFile(file);
          assets.push({
            absoluteSrc: file,
            relativeDest: join('_locales', locale, 'messages.json'),
          });
          await generateChromeMessagesFile();
        }),
      );
    });
  },
});
