import { describe, expect, it, vi, afterEach } from 'vitest';
import { TestProject } from '../utils';

describe('Entrypoint Errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['prepare', 'MutationObserver'],
    ['prepare', 'ResizeObserver'],
    ['build', 'MutationObserver'],
    ['build', 'ResizeObserver'],
  ] as const)(
    'should explain missing browser globals during %s (%s)',
    async (command, globalName) => {
      const project = new TestProject();
      project.addFile(
        'entrypoints/content.ts',
        `new ${globalName}(() => {});
export default defineContentScript({ matches: ['<all_urls>'], main() {} });`,
      );

      const result = project[command]();
      await expect(result).rejects.toMatchObject({
        message: expect.stringContaining('entrypoints/content.ts'),
        cause: expect.objectContaining({
          name: 'ReferenceError',
          message: `${globalName} is not defined`,
          stack: expect.stringContaining('content.ts'),
        }),
      });
      await expect(result).rejects.toThrow(
        /main function.*https:\/\/wxt.dev\/guide\/essentials\/config\/entrypoint-loaders/,
      );
    },
  );

  it('should explain missing browser globals in entrypoint dependencies', async () => {
    const project = new TestProject();
    project.addFile(
      'utils/browser.ts',
      `export function getMatches() {
  new ResizeObserver(() => {});
  return ['<all_urls>'];
}`,
    );
    project.addFile(
      'entrypoints/content.ts',
      `import { getMatches } from '../utils/browser';
export default defineContentScript({ matches: getMatches(), main() {} });`,
    );

    await expect(project.prepare()).rejects.toMatchObject({
      message: expect.stringContaining('entrypoints/content.ts'),
      cause: expect.objectContaining({
        message: 'ResizeObserver is not defined',
        stack: expect.stringContaining('browser.ts'),
      }),
    });
  });

  it.each([
    new TypeError('An unrelated failure'),
    new ReferenceError("Cannot access 'example' before initialization"),
    { message: 'A non-Error failure' },
  ])('should preserve unrelated errors: $message', async (error) => {
    vi.stubGlobal('__testEntrypointError', error);
    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      `throw __testEntrypointError;
export default defineBackground(() => {});`,
    );

    await expect(project.prepare()).rejects.toBe(error);
  });

  it('should allow browser globals inside the main function', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/content.ts',
      `export default defineContentScript({
  matches: ['<all_urls>'],
  main() { new ResizeObserver(() => {}); },
});`,
    );

    await expect(project.prepare()).resolves.toBeUndefined();
    expect(await project.pathExists('.wxt/wxt.d.ts')).toBe(true);
  });
});
