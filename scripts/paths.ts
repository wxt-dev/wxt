import { resolve } from 'node:path';

export const MONOREPO_ROOT = resolve(__dirname, '..');
export const WXT_PACKAGE_DIR = resolve(MONOREPO_ROOT, 'packages/wxt');
export const WXT_E2E_PACKAGE_DIR = resolve(WXT_PACKAGE_DIR, 'e2e');
