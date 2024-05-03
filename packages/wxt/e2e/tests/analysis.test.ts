import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestProject } from '../utils';
import { resetBundleIncrement } from '~/core/builders/vite/plugins';
import open from 'open';

vi.mock('open');
const openMock = vi.mocked(open);

vi.mock('ci-info', () => ({
  isCI: false,
}));

describe('Analysis', () => {
  beforeEach(() => {
    resetBundleIncrement();
  });

  it('should output a stats.html with no part files by default', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
      },
    });

    expect(await project.fileExists('stats.html')).toBe(true);
    expect(await project.fileExists('.output/chrome-mv3/stats-0.json')).toBe(
      false,
    );
  });

  it('should save part files when requested', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
        keepArtifacts: true,
      },
    });

    expect(await project.fileExists('stats.html')).toBe(true);
    expect(await project.fileExists('stats-0.json')).toBe(true);
    expect(await project.fileExists('stats-1.json')).toBe(true);
  });

  it('should support customizing the stats output directory', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
        outputFile: 'stats/bundle.html',
      },
    });

    expect(await project.fileExists('stats/bundle.html')).toBe(true);
  });

  it('should place artifacts next to the custom output file', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
        outputFile: 'stats/bundle.html',
        keepArtifacts: true,
      },
    });

    expect(await project.fileExists('stats/bundle.html')).toBe(true);
    expect(await project.fileExists('stats/bundle-0.json')).toBe(true);
    expect(await project.fileExists('stats/bundle-1.json')).toBe(true);
  });

  it('should open the stats in the browser when requested', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
        open: true,
      },
    });

    expect(openMock).toBeCalledTimes(1);
    expect(openMock).toBeCalledWith(project.resolvePath('stats.html'));
  });
});
