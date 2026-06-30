import 'wxt';
import { defineWxtModule, addAlias } from 'wxt/modules';
import { resolve } from 'node:path';
import type { Entrypoint } from 'wxt';
import { buildEntrypointsFile } from './internal';

export default defineWxtModule({
  name: '@wxt-dev/entrypoint-refs',
  setup(wxt) {
    const entrypointsFilePath = resolve(wxt.config.wxtDir, 'entrypoints.ts');

    addAlias(wxt, '#entrypoints', entrypointsFilePath);

    let captured: Entrypoint[] = [];

    wxt.hooks.hook('entrypoints:resolved', (_, entrypoints) => {
      captured = entrypoints.filter((e) => !e.skipped);
    });

    wxt.hooks.hook('prepare:types', (_, entries) => {
      entries.push({
        path: 'entrypoints.ts',
        text: buildEntrypointsFile(captured, wxt.config.outDir),
      });
    });
  },
});
