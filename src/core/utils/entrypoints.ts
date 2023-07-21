import { Entrypoint } from '../types';
import path, { relative, resolve } from 'node:path';
import { normalizePath } from './paths';

export function getEntrypointName(
  entrypointsDir: string,
  inputPath: string,
  // type: Entrypoint['type'],
): string {
  const relativePath = path.relative(entrypointsDir, inputPath);
  // Grab the string up to the first . or / or \\
  const name = relativePath.split(/[\.\/\\]/, 2)[0];

  return name;
}

export function getEntrypointOutputFile(
  entrypoint: Entrypoint,
  ext: string,
): string {
  return resolve(entrypoint.outputDir, `${entrypoint.name}${ext}`);
}

/**
 * Return's the entrypoint's output path relative to the output directory. Used for paths in the
 * manifest and rollup's bundle.
 */
export function getEntrypointBundlePath(
  entrypoint: Entrypoint,
  outDir: string,
  ext: string,
): string {
  return normalizePath(
    relative(outDir, getEntrypointOutputFile(entrypoint, ext)),
  );
}
