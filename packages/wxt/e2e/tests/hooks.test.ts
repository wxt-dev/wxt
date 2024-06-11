import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProject } from '../utils';
import { WxtHooks } from '~/types';

const hooks: WxtHooks = {
  ready: vi.fn(),
  'build:before': vi.fn(),
  'build:done': vi.fn(),
  'build:manifestGenerated': vi.fn(),
  'build:publicAssets': vi.fn(),
  'entrypoints:resolved': vi.fn(),
  'entrypoints:grouped': vi.fn(),
  'vite:build:extendConfig': vi.fn(),
  'vite:devServer:extendConfig': vi.fn(),
};

function expectHooksToBeCalled(
  called: Record<keyof WxtHooks, boolean | number>,
) {
  Object.keys(hooks).forEach((key) => {
    const hookName = key as keyof WxtHooks;
    const value = called[hookName];
    const times = typeof value === 'number' ? value : value ? 1 : 0;
    expect(
      hooks[hookName],
      `Expected "${hookName}" to be called ${times} time(s)`,
    ).toBeCalledTimes(times);
  });
}

describe('Hooks', () => {
  beforeEach(() => {
    Object.values(hooks).forEach((fn) => fn.mockReset());
  });

  it('prepare should call hooks', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');

    await project.prepare({ hooks });

    expectHooksToBeCalled({
      ready: true,
      'build:before': false,
      'build:done': false,
      'build:publicAssets': false,
      'build:manifestGenerated': false,
      'entrypoints:grouped': false,
      'entrypoints:resolved': true,
      'vite:build:extendConfig': false,
      'vite:devServer:extendConfig': false,
    });
  });

  it('build should call hooks', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');

    await project.build({ hooks });

    expectHooksToBeCalled({
      ready: true,
      'build:before': true,
      'build:done': true,
      'build:publicAssets': true,
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
      'vite:build:extendConfig': 1,
      'vite:devServer:extendConfig': false,
    });
  });

  it('zip should call hooks', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');

    await project.zip({ hooks });

    expectHooksToBeCalled({
      ready: true,
      'build:before': true,
      'build:done': true,
      'build:publicAssets': true,
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
      'vite:build:extendConfig': 1,
      'vite:devServer:extendConfig': false,
    });
  });

  it('server.start should call hooks', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');

    const server = await project.startServer({
      hooks,
      runner: {
        disabled: true,
      },
    });
    await server.stop();

    expectHooksToBeCalled({
      ready: true,
      'build:before': true,
      'build:done': true,
      'build:publicAssets': true,
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
      'vite:build:extendConfig': 2,
      'vite:devServer:extendConfig': 1,
    });
  });
});
