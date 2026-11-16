import { x as spawn } from 'tinyexec';

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
    const res = await spawn('bun', args, {
      throwOnError: true,
      nodeOptions: { cwd: options?.cwd },
    });
    return dedupeDependencies(
      res.stdout
        // `bun pm ls` colorizes its output when colors are enabled, which
        // breaks parsing if we don't strip the escape sequences first.
        .replace(/\u001b\[[0-9;]*m/g, '')
        .split('\n')
        .slice(1) // Skip the first line, is not a dependency
        .map((line) => line.trim())
        .map((line) => /.* (@?\S+)@(\S+)$/.exec(line))
        .filter((match) => !!match)
        .map(([_, name, version]) => ({ name, version })),
    );
  },
};
