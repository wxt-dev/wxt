import path from 'node:path';
import { lstat } from 'node:fs/promises';
import { getBytesDisplay } from '../fs-utils';
import { printTable } from './print-table';
import { styleText } from 'node:util';
import { TextStyle } from '../type-utils';
import { wxt } from '../../internal/wxt';

export async function printFileList(
  log: (message: string) => void,
  header: string,
  baseDir: string,
  files: string[],
): Promise<void> {
  let totalSize = 0;

  const fileRows: string[][] = await Promise.all(
    files.map(async (file, i) => {
      const absoluteFile = path.resolve(baseDir, file);
      const parts = [
        path.relative(process.cwd(), baseDir) + path.sep,
        path.relative(baseDir, absoluteFile),
      ];
      const prefix = i === files.length - 1 ? '  └─' : '  ├─';
      const chunkColor = getChunkColor(file);

      let size = '';
      try {
        const stats = await lstat(absoluteFile);
        totalSize += stats.size;
        size = getBytesDisplay(stats.size);
      } catch (ex) {
        wxt.logger.warn(`Could not get stats of '${file}' error: ${ex}`);
      }

      return [
        `${styleText('gray', prefix)} ${styleText('dim', parts[0])}${styleText(chunkColor, parts[1])}`,
        styleText('dim', size),
      ];
    }),
  );

  fileRows.push([
    `${styleText('cyan', 'Σ Total size:')} ${getBytesDisplay(totalSize)}`,
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
