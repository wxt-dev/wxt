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
  const chunks = [
    ...output.parts.flatMap((part) => part.chunks),
    ...output.publicAssets,
  ].sort((l, r) => {
    const lWeight =
      CHUNK_SORT_WEIGHTS[l.fileName] ??
      CHUNK_SORT_WEIGHTS[extname(l.fileName)] ??
      DEFAULT_SORT_WEIGHT;
    const rWeight =
      CHUNK_SORT_WEIGHTS[r.fileName] ??
      CHUNK_SORT_WEIGHTS[extname(r.fileName)] ??
      DEFAULT_SORT_WEIGHT;
    const diff = lWeight - rWeight;
    if (diff !== 0) return diff;
    return l.fileName.localeCompare(r.fileName);
  });

  let totalSize = 0;

  const chunkRows: string[][] = await Promise.all(
    chunks.map(async (chunk, i) => {
      const file = [
        relative(process.cwd(), config.outDir) + path.sep,
        chunk.fileName,
      ];
      const ext = extname(chunk.fileName);
      const prefix = i === chunks.length - 1 ? '  └─' : '  ├─';
      const color = CHUNK_COLORS[ext] ?? DEFAULT_COLOR;
      const stats = await fs.lstat(resolve(config.outDir, chunk.fileName));
      totalSize += stats.size;
      const size = String(filesize(stats.size));
      return [
        `${pc.gray(prefix)} ${pc.dim(file[0])}${color(file[1])}`,
        pc.dim(size),
      ];
    }),
  );

  printTable(config.logger.log, chunkRows);

  config.logger.log(
    `${pc.cyan('Σ Total size:')} ${String(filesize(totalSize))}`,
  );
}

const DEFAULT_SORT_WEIGHT = 100;
const CHUNK_SORT_WEIGHTS: Record<string, number> = {
  'manifest.json': 0,
  '.html': 1,
  '.js': 2,
  '.css': 3,
};

const DEFAULT_COLOR = pc.blue;
const CHUNK_COLORS: Record<string, (text: string) => string> = {
  '.html': pc.green,
  '.css': pc.magenta,
  '.js': pc.cyan,
};
