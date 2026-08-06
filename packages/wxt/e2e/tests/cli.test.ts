import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { x as spawn } from 'tinyexec';
import { describe, expect, it } from 'vitest';
import { TestProject, WXT_PACKAGE_DIR } from '../utils';

describe('CLI', () => {
  it('should exit after prepare when an entrypoint creates active handles', async () => {
    const project = new TestProject();
    const backgroundPath = project.resolvePath('entrypoints/background.ts');
    await mkdir(dirname(backgroundPath), { recursive: true });
    await writeFile(
      backgroundPath,
      `new BroadcastChannel('wxt-prepare-test');

export default defineBackground(() => {});
`,
    );

    const result = await spawn(
      'node',
      ['--import', 'tsx', 'src/cli/index.ts', 'prepare', project.root],
      {
        timeout: 5_000,
        nodeOptions: { cwd: WXT_PACKAGE_DIR },
      },
    );

    expect(result.exitCode).toBe(0);
  });
});
