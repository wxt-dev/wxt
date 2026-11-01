import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { printFileList } from '../print-file-list';
import { setFakeWxt } from '../../testing/fake-objects';
import { wxt } from '../../../internal/wxt';

describe('printFileList', () => {
  it('resolves relative files against baseDir instead of the process cwd', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'wxt-sources-'));
    await writeFile(path.join(baseDir, 'wxt-marker-a.txt'), '1234567');
    await mkdir(path.join(baseDir, 'packages/shared'), { recursive: true });
    await writeFile(
      path.join(baseDir, 'packages/shared/wxt-marker-b.ts'),
      '12345678',
    );

    setFakeWxt();
    const logs: string[] = [];
    await printFileList((message) => logs.push(message), 'Sources', baseDir, [
      'wxt-marker-a.txt',
      'packages/shared/wxt-marker-b.ts',
    ]);

    expect(wxt.logger.warn).not.toHaveBeenCalled();
    const output = logs.join('\n');
    expect(output).toContain('wxt-marker-a.txt');
    expect(output).toContain(
      path.join('packages', 'shared', 'wxt-marker-b.ts'),
    );
    expect(output).toContain('7 B');
    expect(output).toContain('8 B');
    expect(output).toContain('Σ Total size: 15 B');
  });

  it('still supports absolute file paths', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'wxt-sources-'));
    const file = path.join(baseDir, 'wxt-marker-a.txt');
    await writeFile(file, '12345');

    setFakeWxt();
    const logs: string[] = [];
    await printFileList((message) => logs.push(message), 'Sources', baseDir, [
      file,
    ]);

    expect(wxt.logger.warn).not.toHaveBeenCalled();
    expect(logs.join('\n')).toContain('5 B');
  });
});
