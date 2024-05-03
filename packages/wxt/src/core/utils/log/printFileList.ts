import path from 'node:path';
import pc from 'picocolors';
import fs from 'fs-extra';
import { filesize } from 'filesize';
import { printTable } from './printTable';

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
      const color = getChunkColor(file);
      const stats = await fs.lstat(file);
      totalSize += stats.size;
      const size = String(filesize(stats.size));
      return [
        `${pc.gray(prefix)} ${pc.dim(parts[0])}${color(parts[1])}`,
        pc.dim(size),
      ];
    }),
  );

  fileRows.push([`${pc.cyan('Σ Total size:')} ${String(filesize(totalSize))}`]);

  printTable(log, header, fileRows);
}

const DEFAULT_COLOR = pc.blue;
const CHUNK_COLORS: Record<string, (text: string) => string> = {
  '.js.map': pc.gray,
  '.cjs.map': pc.gray,
  '.mjs.map': pc.gray,
  '.html': pc.green,
  '.css': pc.magenta,
  '.js': pc.cyan,
  '.cjs': pc.cyan,
  '.mjs': pc.cyan,
  '.zip': pc.yellow,
};
function getChunkColor(filename: string) {
  return (
    Object.entries(CHUNK_COLORS).find(([key]) => filename.endsWith(key))?.[1] ??
    DEFAULT_COLOR
  );
}
