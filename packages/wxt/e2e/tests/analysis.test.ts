import { afterAll, describe, it, expect, beforeEach, mock } from 'bun:test';

import open from 'tiny-open';

import { automock, mocked } from '../../src/internal-utils/testing/mock';
import { resetBundleIncrement } from '../../src/internal/builders/vite/plugins';
import { TestProject } from '../utils';

const actualOpen = await import('tiny-open');
mock.module('tiny-open', () => ({
  ...actualOpen,
  default: automock({ default: actualOpen.default }).default,
}));
const openMock = mocked(open);

const actualEnvUtils = await import('../../src/internal-utils/env-utils');
mock.module('../../src/internal-utils/env-utils', () => ({
  ...actualEnvUtils,
  isCI: () => false,
}));

afterAll(() => {
  mock.module('tiny-open', () => actualOpen);
  mock.module('../../src/internal-utils/env-utils', () => actualEnvUtils);
});

describe('Analysis', () => {
  beforeEach(() => {
    resetBundleIncrement();
  });

  it('should output a stats.html with no part files by default', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile('entrypoints/options.html', '<html></html>');
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {});',
    );

    await project.build({
      analysis: {
        enabled: true,
      },
    });

    expect(await project.pathExists('stats.html')).toBe(true);
    expect(await project.pathExists('.output/chrome-mv3/stats-0.json')).toBe(
      false,
    );
  });

  it('should save part files when requested', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile('entrypoints/options.html', '<html></html>');
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

    expect(await project.pathExists('stats.html')).toBe(true);
    expect(await project.pathExists('stats-0.json')).toBe(true);
    expect(await project.pathExists('stats-1.json')).toBe(true);
  });

  it('should support customizing the stats output directory', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile('entrypoints/options.html', '<html></html>');
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

    expect(await project.pathExists('stats/bundle.html')).toBe(true);
  });

  it('should place artifacts next to the custom output file', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile('entrypoints/options.html', '<html></html>');
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

    expect(await project.pathExists('stats/bundle.html')).toBe(true);
    expect(await project.pathExists('stats/bundle-0.json')).toBe(true);
    expect(await project.pathExists('stats/bundle-1.json')).toBe(true);
  });

  it('should open the stats in the browser when requested', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');
    project.addFile('entrypoints/options.html', '<html></html>');
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
