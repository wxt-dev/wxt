import path from 'node:path';
import { lstat } from 'node:fs/promises';
import { filesize } from 'filesize';
import { printTable } from './printTable';
import { styleText } from 'node:util';
import { TextStyle } from '../../../utils/text-style';

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
        `${styleText('gray', prefix)} ${styleText('dim', parts[0])}${styleText(chunkColor, parts[1])}`,
        styleText('dim', size),
      ];
    }),
  );

  fileRows.push([
    `${styleText('cyan', 'Σ Total size:')} ${String(filesize(totalSize))}`,
  ]);

  printTable(log, header, fileRows);
}

const DEFAULT_COLOR: TextStyle = 'blue';
const CHUNK_COLORS: Record<string, TextStyle> = {
  '.js.map': 'gray',
  '.cjs.map': 'gray',
  '.mjs.map': 'gray',
  '.html': 'green',
  '.css': 'magenta',
  '.js': 'cyan',
  '.cjs': 'cyan',
  '.mjs': 'cyan',
  '.zip': 'yellow',
};
function getChunkColor(filename: string): TextStyle {
  return (
    Object.entries(CHUNK_COLORS).find(([key]) => filename.endsWith(key))?.[1] ??
    DEFAULT_COLOR
  );
}
