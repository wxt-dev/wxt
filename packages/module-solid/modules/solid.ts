import 'wxt';
import solid, { type Options as PluginOptions } from '@solidjs/vite-plugin';
import { addImportPreset, addViteConfig, defineWxtModule } from 'wxt/modules';

// unimport's `solid-js` preset still targets Solid 1, so define Solid 2's
// imports here until it catches up
const solidCoreImports = [
  // Reactivity
  'createSignal',
  'createMemo',
  'createEffect',
  'createRenderEffect',
  'createTrackedEffect',
  'createReaction',
  'createRoot',
  'createDeferred',
  'createProjection',
  'createOptimistic',
  'createOptimisticStore',
  'createStore',
  'createContext',
  'useContext',
  'children',
  'lazy',
  'lazyModule',
  'createUniqueId',
  'untrack',
  'action',
  'onCleanup',
  'onSettled',
  'onFlush',
  'runWithOwner',
  'getOwner',
  'merge',
  'omit',
  'reconcile',
  'refresh',
  'until',
  'latest',
  'isPending',
  'mapArray',
  // Control flow
  'For',
  'Show',
  'Switch',
  'Match',
  'Repeat',
  'Errored',
  'Loading',
  'Reveal',
];

const solidWebImports = [
  'render',
  'hydrate',
  'Portal',
  'dynamic',
  'dynamicComponent',
  'clientOnly',
  'isServer',
  'isDev',
  'useHead',
  'httpStatus',
  'httpHeader',
  'renderToString',
  'renderToStream',
  /** @deprecated Use `dynamic` instead. */
  'Dynamic',
];

export default defineWxtModule<SolidModuleOptions>({
  name: '@wxt-dev/module-solid',
  configKey: 'solid',
  setup(wxt, options) {
    const { vite } = options ?? {};

    addViteConfig(wxt, () => ({
      plugins: [solid(vite)],
      build: {
        target: 'esnext',
      },
    }));

    addImportPreset(wxt, { from: 'solid-js', imports: solidCoreImports });
    addImportPreset(wxt, { from: '@solidjs/web', imports: solidWebImports });

    // Enable auto-imports for JSX files
    wxt.hook('config:resolved', (wxt) => {
      // In older versions of WXT, `wxt.config.imports` could be false
      if (!wxt.config.imports) return;

      wxt.config.imports.dirsScanOptions ??= {};
      wxt.config.imports.dirsScanOptions.filePatterns = [
        // Default plus JSX/TSX
        '*.{ts,js,mjs,cjs,mts,cts,jsx,tsx}',
      ];
    });
  },
});

export interface SolidModuleOptions {
  vite?: PluginOptions;
}

declare module 'wxt' {
  export interface InlineConfig {
    solid?: SolidModuleOptions;
  }
}
