import { UnimportOptions, createUnimport } from 'unimport';
import { Entrypoint, InternalConfig } from '../types';
import fs from 'fs-extra';
import { relative, resolve } from 'path';
import { getEntrypointBundlePath } from '../utils/entrypoints';
import { getUnimportOptions } from '../utils/auto-imports';
import { getEntrypointGlobals, getGlobals } from '../utils/globals';
import { getPublicFiles } from '../utils/public';
import { normalizePath } from '../utils/paths';
import path from 'node:path';
import { Message, parseI18nMessages } from '../utils/i18n';
import { writeFileIfDifferent } from '../utils/fs';

/**
 * Generate and write all the files inside the `InternalConfig.typesDir` directory.
 */
export async function generateTypesDir(
  entrypoints: Entrypoint[],
  config: InternalConfig,
): Promise<void> {
  await fs.ensureDir(config.typesDir);

  const references: string[] = [];

  const imports = getUnimportOptions(config);
  if (imports !== false) {
    references.push(await writeImportsDeclarationFile(config, imports));
  }

  references.push(await writePathsDeclarationFile(entrypoints, config));
  references.push(await writeI18nDeclarationFile(config));
  references.push(await writeGlobalsDeclarationFile(config));

  const mainReference = await writeMainDeclarationFile(references, config);
  await writeTsConfigFile(mainReference, config);
}

async function writeImportsDeclarationFile(
  config: InternalConfig,
  unimportOptions: Partial<UnimportOptions>,
): Promise<string> {
  const filePath = resolve(config.typesDir, 'imports.d.ts');
  const unimport = createUnimport(unimportOptions);

  // Load project imports into unimport memory so they are output via generateTypeDeclarations
  await unimport.scanImportsFromDir(undefined, { cwd: config.srcDir });

  await writeFileIfDifferent(
    filePath,
    ['// Generated by wxt', await unimport.generateTypeDeclarations()].join(
      '\n',
    ) + '\n',
  );

  return filePath;
}

async function writePathsDeclarationFile(
  entrypoints: Entrypoint[],
  config: InternalConfig,
): Promise<string> {
  const filePath = resolve(config.typesDir, 'paths.d.ts');
  const unions = entrypoints
    .map((entry) =>
      getEntrypointBundlePath(
        entry,
        config.outDir,
        entry.inputPath.endsWith('.html') ? '.html' : '.js',
      ),
    )
    .concat(await getPublicFiles(config))
    .map(normalizePath)
    .map((path) => `    | "/${path}"`)
    .sort()
    .join('\n');

  const template = `// Generated by wxt
import "wxt/browser";

declare module "wxt/browser" {
  type PublicPath =
{{ union }}
  export interface WxtRuntime extends Runtime.Static {
    getURL(path: PublicPath): string;
  }
}
`;

  await writeFileIfDifferent(
    filePath,
    template.replace('{{ union }}', unions || '    | never'),
  );

  return filePath;
}

async function writeI18nDeclarationFile(
  config: InternalConfig,
): Promise<string> {
  const filePath = resolve(config.typesDir, 'i18n.d.ts');
  const defaultLocale = config.manifest.default_locale;
  const template = `// Generated by wxt
import "wxt/browser";

declare module "wxt/browser" {
  /**
   * See https://developer.chrome.com/docs/extensions/reference/i18n/#method-getMessage
   */
  interface GetMessageOptions {
    /**
     * See https://developer.chrome.com/docs/extensions/reference/i18n/#method-getMessage
     */
    escapeLt?: boolean
  }

  export interface WxtI18n extends I18n.Static {
{{ overrides }}
  }
}
`;

  let messages: Message[];
  if (defaultLocale) {
    const defaultLocalePath = path.resolve(
      config.publicDir,
      '_locales',
      defaultLocale,
      'messages.json',
    );
    const content = JSON.parse(await fs.readFile(defaultLocalePath, 'utf-8'));
    messages = parseI18nMessages(content);
  } else {
    messages = parseI18nMessages({});
  }

  const overrides = messages.map((message) => {
    return `    /**
     * ${message.description ?? 'No message description.'}
     * 
     * "${message.message}"
     */
    getMessage(
      messageName: "${message.name}",
      substitutions?: string | string[],
      options?: GetMessageOptions,
    ): string;`;
  });
  await writeFileIfDifferent(
    filePath,
    template.replace('{{ overrides }}', overrides.join('\n')),
  );

  return filePath;
}

async function writeGlobalsDeclarationFile(
  config: InternalConfig,
): Promise<string> {
  const filePath = resolve(config.typesDir, 'globals.d.ts');
  const globals = [...getGlobals(config), ...getEntrypointGlobals(config, '')];
  await writeFileIfDifferent(
    filePath,
    [
      '// Generated by wxt',
      'export {}',
      'declare global {',
      ...globals.map((global) => `  const ${global.name}: ${global.type};`),
      '}',
    ].join('\n') + '\n',
  );
  return filePath;
}

async function writeMainDeclarationFile(
  references: string[],
  config: InternalConfig,
): Promise<string> {
  const dir = config.wxtDir;
  const filePath = resolve(dir, 'wxt.d.ts');
  await writeFileIfDifferent(
    filePath,
    [
      '// Generated by wxt',
      `/// <reference types="vite/client" />`,
      ...references.map(
        (ref) =>
          `/// <reference types="./${normalizePath(relative(dir, ref))}" />`,
      ),
    ].join('\n') + '\n',
  );
  return filePath;
}

async function writeTsConfigFile(
  mainReference: string,
  config: InternalConfig,
) {
  const dir = config.wxtDir;
  const rootPath = normalizePath(relative(dir, config.root));
  const srcPath = normalizePath(relative(dir, config.srcDir));
  await writeFileIfDifferent(
    resolve(dir, 'tsconfig.json'),
    `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "strict": true,
    "lib": ["DOM", "WebWorker"],
    "skipLibCheck": true,
    "paths": {
      "@@": ["${rootPath}"],
      "@@/*": ["${rootPath}/*"],
      "~~": ["${rootPath}"],
      "~~/*": ["${rootPath}/*"],
      "@": ["${srcPath}"],
      "@/*": ["${srcPath}/*"],
      "~": ["${srcPath}"],
      "~/*": ["${srcPath}/*"]
    }
  },
  "include": [
    "${normalizePath(relative(dir, config.root))}/**/*",
    "./${normalizePath(relative(dir, mainReference))}"
  ],
  "exclude": ["${normalizePath(relative(dir, config.outBaseDir))}"]
}`,
  );
}
