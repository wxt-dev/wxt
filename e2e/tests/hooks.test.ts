import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProject } from '../utils';
import { WxtHooks } from '~/types';

const hooks: WxtHooks = {
  ready: vi.fn(),
  'build:before': vi.fn(),
  'build:done': vi.fn(),
  'build:manifestGenerated': vi.fn(),
  'entrypoints:resolved': vi.fn(),
  'entrypoints:grouped': vi.fn(),
};

function expectHooksToBeCalled(called: Record<keyof WxtHooks, boolean>) {
  Object.keys(hooks).forEach((key) => {
    const hookName = key as keyof WxtHooks;
    const times = called[hookName] ? 1 : 0;
    expect(
      hooks[hookName],
      `Expected "${hookName}" to be called ${times} time(s)`,
    ).toBeCalledTimes(called[hookName] ? 1 : 0);
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
      'build:manifestGenerated': false,
      'entrypoints:grouped': false,
      'entrypoints:resolved': true,
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
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
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
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
    });
  });

  it('server.start should call hooks', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html', '<html></html>');

    const server = await project.createServer({
      hooks,
      runner: {
        disabled: true,
      },
    });
    await server.start();
    await server.stop();

    expectHooksToBeCalled({
      ready: true,
      'build:before': true,
      'build:done': true,
      'build:manifestGenerated': true,
      'entrypoints:grouped': true,
      'entrypoints:resolved': true,
    });
  });
});
