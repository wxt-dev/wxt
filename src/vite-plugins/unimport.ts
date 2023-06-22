import Unimport, { UnimportPluginOptions } from 'unimport/unplugin';
import { UserConfig } from '../types';
import path from 'node:path';
import * as vite from 'vite';
import fs from 'fs-extra';

/**
 * Apply defaults and returns an instance of the unimport plugin.
 *
 * @param root Absolute path to the vite root
 * @param srcDir Absolute path to the source directory
 * @param imports Custom import settings defined by the user
 */
export function unimport(
  root: string,
  srcDir: string,
  imports: UserConfig['imports'],
) {
  const declartionFile = path.resolve(root, '.exvite/types/imports.d.ts');
  const declarationDir = path.dirname(declartionFile);
  fs.ensureDirSync(declarationDir);

  const defaultOptions: UnimportPluginOptions = {
    include: srcDir,
    exclude: [],
    addons: [],
    debugLog: () => {},
    dts: declartionFile,
    imports: [{ name: '*', as: 'browser', from: 'webextension-polyfill' }],
    presets: [
      // Scan for exported functions from the client package
      { package: 'exvite/client' },
    ],
    virtualImports: [],
    warn: () => {},
    dirs: ['components', 'composables', 'hooks', 'utils'],
  };
  const unimportConfig = vite.mergeConfig(
    defaultOptions,
    imports ?? {},
  ) as UnimportPluginOptions;
  const unimport: typeof Unimport.vite =
    // @ts-expect-error: esm availabe within the default object?
    Unimport.vite ?? Unimport.default?.vite;

  return unimport(unimportConfig);
}
