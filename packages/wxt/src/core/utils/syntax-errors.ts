import { relative } from 'node:path';
import { wxt } from '../wxt';
import { styleText } from 'node:util';

export interface BabelSyntaxError extends SyntaxError {
  code: 'BABEL_PARSER_SYNTAX_ERROR';
  frame?: string;
  id: string;
  loc: { line: number; column: number };
}

export function isBabelSyntaxError(error: unknown): error is BabelSyntaxError {
  return (
    error instanceof SyntaxError &&
    (error as any).code === 'BABEL_PARSER_SYNTAX_ERROR'
  );
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
    message += '\n\n' + styleText('red', error.frame);
  }
  wxt.logger.error(message);
}
