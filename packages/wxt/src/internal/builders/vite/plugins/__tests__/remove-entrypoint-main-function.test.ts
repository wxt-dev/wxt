import { describe, expect, it } from 'vitest';
import { removeEntrypointMainFunction } from '../remove-entrypoint-main-function';
import { fakeResolvedConfig } from '../../../../../internal-utils/testing/fake-objects';

function getIdFilter(root: string, path: string): RegExp {
  const plugin = removeEntrypointMainFunction(
    fakeResolvedConfig({ root }),
    path,
  );
  const transform = plugin.transform as { filter: { id: RegExp } };
  return transform.filter.id;
}

describe('Remove Entrypoint Main Function Plugin', () => {
  it.each([
    '/projects/extension',
    '/projects/.claude/worktrees/sync+extension',
    '/projects/extension (copy)',
    '/projects/[extension]',
    '/projects/extension.v2',
  ])('matches the entrypoint in %s', (root) => {
    const filter = getIdFilter(root, 'entrypoints/content.ts');

    expect(filter.test(`${root}/entrypoints/content.ts`)).toBe(true);
  });

  it('matches the path literally', () => {
    const filter = getIdFilter(
      '/projects/sync+extension',
      'entrypoints/content.ts',
    );

    // Read as a regex, `c+` and `.` would match these too
    expect(
      filter.test('/projects/syncccextension/entrypoints/content.ts'),
    ).toBe(false);
    expect(filter.test('/projects/syncextension/entrypoints/content.ts')).toBe(
      false,
    );
    expect(filter.test('/projects/sync+extension/entrypoints/contentXts')).toBe(
      false,
    );
  });
});
