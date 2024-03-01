import { NpmListProject, flattenNpmListOutput, npm } from './npm';
import { WxtPackageManagerImpl } from './types';

export const pnpm: WxtPackageManagerImpl = {
  overridesKey: 'resolutions', // "pnpm.overrides", but I don't want to deal with nesting
  downloadDependency(...args) {
    return npm.downloadDependency(...args);
  },
  async listDependencies(options) {
    const args = ['ls', '--ignore-workspace', '--json'];
    if (options?.all) {
      args.push('--depth', 'Infinity');
    }
    const { execa } = await import('execa');
    const res = await execa('pnpm', args, { cwd: options?.cwd });
    const projects: NpmListProject[] = JSON.parse(res.stdout);

    return flattenNpmListOutput(projects);
  },
};
