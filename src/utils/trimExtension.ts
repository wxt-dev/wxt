import path from 'node:path';

export function trimExtension(filename: string): string;
export function trimExtension(filename: undefined): undefined;
export function trimExtension(filename: string | undefined): string | undefined;
export function trimExtension(
  filename: string | undefined,
): string | undefined {
  return filename?.replace(path.extname(filename), '');
}
