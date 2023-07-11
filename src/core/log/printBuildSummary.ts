import path, { relative, resolve } from 'path';
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
    ...output.steps.flatMap((step) => step.chunks),
    ...output.publicAssets,
  ].sort((l, r) => {
    const lWeight = getChunkSortWeight(l.fileName);
    const rWeight = getChunkSortWeight(r.fileName);
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
      const prefix = i === chunks.length - 1 ? '  └─' : '  ├─';
      const color = getChunkColor(chunk.fileName);
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
  '.js.map': 2,
  '.js': 2,
  '.css': 3,
};
function getChunkSortWeight(filename: string) {
  return (
    Object.entries(CHUNK_SORT_WEIGHTS).find(([key, value]) => {
      if (filename.endsWith(key)) return value;
    })?.[1] ?? DEFAULT_SORT_WEIGHT
  );
}

const DEFAULT_COLOR = pc.blue;
const CHUNK_COLORS: Record<string, (text: string) => string> = {
  '.js.map': pc.gray,
  '.html': pc.green,
  '.css': pc.magenta,
  '.js': pc.cyan,
};
function getChunkColor(filename: string) {
  return (
    Object.entries(CHUNK_COLORS).find(([key, value]) => {
      if (filename.endsWith(key)) return value;
    })?.[1] ?? DEFAULT_COLOR
  );
}
