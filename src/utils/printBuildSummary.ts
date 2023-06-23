import path, { extname, relative, resolve } from 'path';
import { BuildOutput, InternalConfig } from '../types';
import { printTable } from './printTable';
import pc from 'picocolors';
import fs from 'fs-extra';
import { filesize } from 'filesize';

export async function printBuildSummary(
  output: BuildOutput,
  config: InternalConfig,
) {
  const chunks = output.sort((l, r) => {
    const lWeight =
      CHUNK_SORT_WEIGHTS[extname(l.fileName)] ?? DEFAULT_SORT_WEIGHT;
    const rWeight =
      CHUNK_SORT_WEIGHTS[extname(r.fileName)] ?? DEFAULT_SORT_WEIGHT;
    return lWeight - rWeight;
  });

  const chunkRows: string[][] = await Promise.all(
    chunks.map(async (chunk) => {
      const file = [
        relative(process.cwd(), config.outDir) + path.sep,
        chunk.fileName,
      ];
      const ext = extname(chunk.fileName);
      const color = CHUNK_COLORS[ext] ?? DEFAULT_COLOR;
      const stats = await fs.lstat(resolve(config.outDir, chunk.fileName));
      const size = String(filesize(stats.size));
      return [`${pc.dim(file[0])}${color(file[1])}`, pc.dim(size)];
    }),
  );

  printTable(config.logger.log, [['Chunks'], ...chunkRows]);
}

const DEFAULT_SORT_WEIGHT = 100;
const CHUNK_SORT_WEIGHTS: Record<string, number> = {
  '.html': 0,
  '.js': 1,
  '.css': 2,
};

const DEFAULT_COLOR = pc.blue;
const CHUNK_COLORS: Record<string, (text: string) => string> = {
  '.html': pc.green,
  '.css': pc.magenta,
  '.js': pc.cyan,
};
