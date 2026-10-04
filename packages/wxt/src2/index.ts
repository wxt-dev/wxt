/**
 * This module contains:
 *
 * - JS APIs used by the CLI to build extensions or start dev mode.
 * - Helper functions for defining project config.
 * - Types for building and extension or configuring WXT.
 *
 * @module wxt
 */
export * from './build';
export * from './clean';
export * from './create-server';
export * from './define-config';
export * from './define-web-ext-config';
export * from './initialize';
export * from './prepare';
export * from './types';
export * from './version';
export * from './zip';
export { getEntrypointBundlePath } from './internal-utils/entrypoint-utils';
export { normalizePath } from './internal-utils/path-utils';
