import { tryImport } from './module-utils';

export const getEslintVersion = async (): Promise<string[]> => {
  const mod = await tryImport(() => import('eslint'));
  return mod
    ? (mod.ESLint.version?.split('.') ?? [])
    : // Return an empty version when there's an error importing ESLint
      [];
};
