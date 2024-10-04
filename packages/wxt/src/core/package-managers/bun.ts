import { dedupeDependencies, npm } from './npm';
import { WxtPackageManagerImpl } from './types';

export const bun: WxtPackageManagerImpl = {
  overridesKey: 'overrides', // But also supports "resolutions"
  downloadDependency(...args) {
    return npm.downloadDependency(...args);
  },
  async listDependencies(options) {
    const args = ['pm', 'ls'];
    if (options?.all) {
      args.push('--all');
    }
    const { default: spawn } = await import('nano-spawn');
    const res = await spawn('bun', args, { cwd: options?.cwd });
    return dedupeDependencies(
      res.stdout
        .split('\n')
        .slice(1) // Skip the first line, is not a dependency
        .map((line) => line.trim())
        .map((line) => /.* (@?\S+)@(\S+)$/.exec(line))
        .filter((match) => !!match)
        .map(([_, name, version]) => ({ name, version })),
    );
  },
};
