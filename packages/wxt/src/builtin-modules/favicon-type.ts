import { defineWxtModule } from '../modules';

export default defineWxtModule({
  name: 'wxt:built-in:favicon-type',
  setup(wxt) {
    wxt.hooks.hook('prepare:publicPaths', async (wxt, paths) => {
      if (wxt.config.manifest.permissions?.includes('favicon')) {
        paths.push('_favicon/');
        wxt.hooks.hook('build:manifestGenerated', (_, manifest) => {
          const favicon_resource: any = {
            resources: ['/_favicon/*'],
            matches: [],
          };
          manifest.web_accessible_resources ??= [];
          manifest.web_accessible_resources?.push(favicon_resource);
        });
      }
    });
  },
});
