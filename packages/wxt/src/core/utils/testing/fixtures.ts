import { spawnSync } from 'node:child_process';
import { describe } from 'vitest';

export function describeWithBin(
  bin: string,
  title: string,
  callback: () => void,
) {
  if (process.env.CI === 'true') return describe(title, callback);

  const result = spawnSync(bin, ['--version'], {
    stdio: 'ignore',
    shell: true,
  });
  if (result.status !== 0) return describe.skip(title, callback);
  return describe(title, callback);
}
