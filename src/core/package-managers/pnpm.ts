import { NpmListProject, flattenNpmListOutput, npm } from './npm';
import { WxtPackageManagerImpl } from './types';

export const pnpm: WxtPackageManagerImpl = {
  downloadDependency(...args) {
    return npm.downloadDependency(...args);
  },
  async listDependencies(options) {
    const args = ['ls', '--json'];
    if (options?.all) {
      args.push('--depth', 'Infinity');
    }
    // @ts-expect-error: Internal, testing only flag
    if (options?.ignoreWorkspace) {
      args.push('--ignore-workspace');
    }
    const { execa } = await import('execa');
    const res = await execa('pnpm', args, { cwd: options?.cwd });
    const projects: NpmListProject[] = JSON.parse(res.stdout);

    return flattenNpmListOutput(projects);
  },
};
