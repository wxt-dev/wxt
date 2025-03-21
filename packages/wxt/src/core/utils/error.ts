import { relative } from 'node:path';
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
