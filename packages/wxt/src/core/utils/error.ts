import { isAbsolute, relative, resolve } from 'node:path';
import pc from 'picocolors';
import { wxt } from '../wxt';

export interface BabelSyntaxError extends SyntaxError {
  code: 'BABEL_PARSER_SYNTAX_ERROR';
  frame?: string;
  id: string;
  loc: { line: number; column: number };
}

export function isBabelSyntaxError(
  error: SyntaxError & { code?: string },
): error is BabelSyntaxError {
  return error.code === 'BABEL_PARSER_SYNTAX_ERROR';
}

export function logBabelSyntaxError(error: BabelSyntaxError) {
  let filename = relative(wxt.config.root, error.id);
  if (filename.startsWith('..')) {
    filename = error.id;
  }
  let message = error.message.replace(
    /\(\d+:\d+\)$/,
    `(${filename}:${error.loc.line}:${error.loc.column + 1})`,
  );
  if (error.frame) {
    message += '\n\n' + pc.red(error.frame);
  }
  wxt.logger.error(message);
}

export interface ModuleNotFoundError extends Error {
  code: 'ERR_MODULE_NOT_FOUND';
}

export function isModuleNotFoundError(
  error: Error & { code?: string },
): error is ModuleNotFoundError {
  return error.code === 'ERR_MODULE_NOT_FOUND';
}

export interface ModuleNotFoundErrorDetails {
  id: string;
  importer: string;
}

export function parseModuleNotFoundError(
  error: ModuleNotFoundError,
): ModuleNotFoundErrorDetails | null {
  // Cannot find module 'xyz' imported from '/@fs//path/to/abc.ts'
  const match = error.message.match(
    /^Cannot find module '(.*)' imported from '(.*)'/,
  );
  return (
    match && {
      id: match[1],
      importer: match[2],
    }
  );
}

export interface VitePluginError extends Error {
  code: 'PLUGIN_ERROR';
  pluginCode: string;
  plugin: string;
  hook: string;
}

export function isVitePluginError(
  error: Error & { code?: string },
): error is VitePluginError {
  return error.code === 'PLUGIN_ERROR';
}

export interface ViteLoadFallbackError extends VitePluginError {
  plugin: 'vite:load-fallback';
  hook: 'load';
  path: string;
}

export function isViteLoadFallbackError(
  error: VitePluginError,
): error is ViteLoadFallbackError {
  return error.plugin === 'vite:load-fallback' && error.hook === 'load';
}

export function resolveErrorFiles(err: Error): string[] {
  const errorFiles: string[] = [];

  if ('cause' in err && err.cause instanceof Error) {
    err = err.cause;
  }

  // TODO: support syntax errors from ESBuild and others.
  if (err instanceof SyntaxError) {
    if (isBabelSyntaxError(err)) {
      logBabelSyntaxError(err);
      errorFiles.push(err.id);

      wxt.logger.info('Waiting for syntax error to be fixed...');
    }
  } else if (isModuleNotFoundError(err)) {
    const details = parseModuleNotFoundError(err);
    if (details && details.importer.startsWith('/@fs/')) {
      errorFiles.push(details.importer.slice(5));

      wxt.logger.error(err.message);
      wxt.logger.info('Waiting for import specifier to be fixed...');
    }
  } else if (
    isVitePluginError(err) &&
    isViteLoadFallbackError(err) &&
    err.pluginCode === 'ENOENT'
  ) {
    // Extract the importer from the error message, which is produced by Rollup:
    // https://github.com/rollup/rollup/blob/384d5333fbc3d8918b41856822376da2a65ccaa3/src/ModuleLoader.ts#L288-L289
    const importerMatch = err.message.match(
      // "Could not load /path/to/xyz.ts (imported by src/module.ts)"
      /\(imported by (.*)\)/,
    );
    if (importerMatch) {
      errorFiles.push(resolve(importerMatch[1]));
    }
    // Ignore non-absolute paths, which are likely virtual modules.
    if (isAbsolute(err.path)) {
      errorFiles.push(err.path);
    }
    if (errorFiles.length) {
      // The error was already logged by Vite, so just log this.
      wxt.logger.info('Waiting for missing file to be added...');
    }
  } else if (
    // Vite throws an error when Rollup cannot resolve an import at build time:
    // https://github.com/vitejs/vite/blob/998303b438734e8219715fe6883b97fb10404c16/packages/vite/src/node/build.ts#L1027-L1032
    err.message.includes('Rollup failed to resolve import')
  ) {
    const importerMatch = err.message.match(/ from "(.*)"/);
    if (importerMatch) {
      errorFiles.push(importerMatch[1]);

      // The error was already logged by Vite, so just log this.
      wxt.logger.info('Waiting for import specifier to be fixed...');
    }
  }

  return errorFiles;
}
