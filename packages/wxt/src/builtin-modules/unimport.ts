import { addViteConfig, defineWxtModule } from '../modules';
import type {
  EslintGlobalsPropValue,
  Wxt,
  WxtDirFileEntry,
  WxtModule,
  WxtResolvedUnimportOptions,
} from '../types';
import { type Unimport, createUnimport, toExports } from 'unimport';
import UnimportPlugin from 'unimport/unplugin';

export default defineWxtModule({
  name: 'wxt:built-in:unimport',
  setup(wxt) {
    let unimport: Unimport;
    const isEnabled = () => !wxt.config.imports.disabled;

    // Add user module imports to config
    wxt.hooks.hook('config:resolved', () => {
      const addModuleImports = (module: WxtModule<any>) => {
        if (!module.imports) return;

        wxt.config.imports.imports ??= [];
        wxt.config.imports.imports.push(...module.imports);
      };

      wxt.config.builtinModules.forEach(addModuleImports);
      wxt.config.userModules.forEach(addModuleImports);
    });

    // Create unimport instance AFTER "config:resolved" so any modifications to the
    // config inside "config:resolved" are applied.
    wxt.hooks.afterEach((event) => {
      if (event.name === 'config:resolved') {
        unimport = createUnimport(wxt.config.imports);
      }
    });

    // Generate types
    wxt.hooks.hook('prepare:types', async (_, entries) => {
      // Update cache before each rebuild
      await unimport.init();

      // Always generate the #import module types
      entries.push(await getImportsModuleEntry(wxt, unimport));

      if (!isEnabled()) return;

      // Only create global types when user has enabled auto-imports
      entries.push(await getImportsDeclarationEntry(unimport));

      if (wxt.config.imports.eslintrc.enabled === false) return;

      // Only generate ESLint config if that feature is enabled
      entries.push(
        await getEslintConfigEntry(
          unimport,
          wxt.config.imports.eslintrc.enabled,
          wxt.config.imports,
        ),
      );
    });

    // Add vite plugin
    addViteConfig(wxt, () => ({
      plugins: [UnimportPlugin.vite(wxt.config.imports)],
    }));
  },
});

async function getImportsDeclarationEntry(
  unimport: Unimport,
): Promise<WxtDirFileEntry> {
  return {
    path: 'types/imports.d.ts',
    text: [
      '// Generated by wxt',
      await unimport.generateTypeDeclarations(),
      '',
    ].join('\n'),
    tsReference: true,
  };
}

async function getImportsModuleEntry(
  wxt: Wxt,
  unimport: Unimport,
): Promise<WxtDirFileEntry> {
  const imports = await unimport.getImports();
  return {
    path: 'types/imports-module.d.ts',
    text: [
      '// Generated by wxt',
      '// Types for the #import virtual module',
      "declare module '#imports' {",
      `  ${toExports(imports, wxt.config.wxtDir, true).replaceAll('\n', '\n  ')}`,
      '}',
      '',
    ].join('\n'),
    tsReference: true,
  };
}

async function getEslintConfigEntry(
  unimport: Unimport,
  version: 8 | 9,
  options: WxtResolvedUnimportOptions,
): Promise<WxtDirFileEntry> {
  const globals = (await unimport.getImports())
    .map((i) => i.as ?? i.name)
    .filter(Boolean)
    .sort()
    .reduce<Record<string, EslintGlobalsPropValue>>((globals, name) => {
      globals[name] = options.eslintrc.globalsPropValue;
      return globals;
    }, {});

  if (version <= 8) return getEslint8ConfigEntry(options, globals);
  else return getEslint9ConfigEntry(options, globals);
}

export function getEslint8ConfigEntry(
  options: WxtResolvedUnimportOptions,
  globals: Record<string, EslintGlobalsPropValue>,
): WxtDirFileEntry {
  return {
    path: options.eslintrc.filePath,
    text: JSON.stringify({ globals }, null, 2) + '\n',
  };
}

export function getEslint9ConfigEntry(
  options: WxtResolvedUnimportOptions,
  globals: Record<string, EslintGlobalsPropValue>,
): WxtDirFileEntry {
  return {
    path: options.eslintrc.filePath,
    text: `const globals = ${JSON.stringify(globals, null, 2)}

export default {
  name: "wxt/auto-imports",
  languageOptions: {
    globals,
    /** @type {import('eslint').Linter.SourceType} */
    sourceType: "module",
  },
};
`,
  };
}
