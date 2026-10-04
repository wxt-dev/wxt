import { tryImport } from './module-utils';

export async function getEslintVersion(): Promise<string[]> {
  const mod = await tryImport(() => import('eslint'));
  return mod
    ? (mod.ESLint.version?.split('.') ?? [])
    : // Return an empty version when there's an error importing ESLint
      [];
}
