import path from 'node:path';
import { lstat } from 'node:fs/promises';
import { filesize } from 'filesize';
import { printTable } from './printTable';
import { color, type ColorFormatter } from '../color';

export async function printFileList(
  log: (message: string) => void,
  header: string,
  baseDir: string,
  files: string[],
): Promise<void> {
  let totalSize = 0;

  const fileRows: string[][] = await Promise.all(
    files.map(async (file, i) => {
      const parts = [
        path.relative(process.cwd(), baseDir) + path.sep,
        path.relative(baseDir, file),
      ];
      const prefix = i === files.length - 1 ? '  └─' : '  ├─';
      const chunkColor = getChunkColor(file);
      const stats = await lstat(file);
      totalSize += stats.size;
      const size = String(filesize(stats.size));
      return [
        `${color.gray(prefix)} ${color.dim(parts[0])}${chunkColor(parts[1])}`,
        color.dim(size),
      ];
    }),
  );

  fileRows.push([
    `${color.cyan('Σ Total size:')} ${String(filesize(totalSize))}`,
  ]);

  printTable(log, header, fileRows);
}

const DEFAULT_COLOR = color.blue;
const CHUNK_COLORS: Record<string, ColorFormatter> = {
  '.js.map': color.gray,
  '.cjs.map': color.gray,
  '.mjs.map': color.gray,
  '.html': color.green,
  '.css': color.magenta,
  '.js': color.cyan,
  '.cjs': color.cyan,
  '.mjs': color.cyan,
  '.zip': color.yellow,
};
function getChunkColor(filename: string): ColorFormatter {
  return (
    Object.entries(CHUNK_COLORS).find(([key]) => filename.endsWith(key))?.[1] ??
    DEFAULT_COLOR
  );
}
