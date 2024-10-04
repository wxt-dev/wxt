import { Dependency } from '../../types';
import { WxtPackageManagerImpl } from './types';
import { dedupeDependencies, npm } from './npm';

export const yarn: WxtPackageManagerImpl = {
  overridesKey: 'resolutions',
  downloadDependency(...args) {
    return npm.downloadDependency(...args);
  },
  async listDependencies(options) {
    const args = ['list', '--json'];
    if (options?.all) {
      args.push('--depth', 'Infinity');
    }
    const { default: spawn } = await import('nano-spawn');
    const res = await spawn('yarn', args, { cwd: options?.cwd });
    const tree = res.stdout
      .split('\n')
      .map<JsonLine>((line) => JSON.parse(line))
      .find((line) => line.type === 'tree')?.data as JsonLineTree | undefined;
    if (tree == null) throw Error("'yarn list --json' did not output a tree");

    const queue = [...tree.trees];
    const dependencies: Dependency[] = [];

    while (queue.length > 0) {
      const { name: treeName, children } = queue.pop()!;
      const match = /(@?\S+)@(\S+)$/.exec(treeName);
      if (match) {
        const [_, name, version] = match;
        dependencies.push({ name, version });
      }
      if (children != null) {
        queue.push(...children);
      }
    }

    return dedupeDependencies(dependencies);
  },
};

type JsonLine =
  | { type: unknown; data: unknown }
  | { type: 'tree'; data: JsonLineTree };

interface JsonLineTree {
  type: 'list';
  trees: Tree[];
}

interface Tree {
  name: string;
  children?: Tree[];
}
