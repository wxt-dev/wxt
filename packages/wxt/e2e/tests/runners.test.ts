import { expect, describe, vi, it, beforeEach } from 'vitest';
import { ExtensionRunner } from '../../src';
import { createSafariRunner } from '../../src/core/runners/safari';
import { createManualRunner } from '../../src/core/runners/manual';
import { createWebExtRunner } from '../../src/core/runners/web-ext';
import { createWslRunner } from '../../src/core/runners/wsl';
import { TestProject } from '../utils';
import { wxt } from '../../src/core/wxt';

// Globals for modifying mock behaviors

var isWsl = false;
var isWebExtAvailable = true;

// Mock runners to create constants for checking equality

type TestExtensionRunner = { name: string } & ExtensionRunner;

function createMockExtensionRunner(name: string): TestExtensionRunner {
  return {
    name,
    closeBrowser: () => Promise.resolve(),
    openBrowser: () => Promise.resolve(),
  };
}

vi.mock('../../src/core/runners/safari', () => {
  const runner = createMockExtensionRunner('safari');
  return { createSafariRunner: () => runner };
});
const safariRunner = createSafariRunner();

vi.mock('../../src/core/runners/manual', () => {
  const runner = createMockExtensionRunner('manual');
  return { createManualRunner: () => runner };
});
const manualRunner = createManualRunner();

vi.mock('../../src/core/runners/web-ext', () => {
  const runner = createMockExtensionRunner('web-ext');
  return {
    createWebExtRunner: () => {
      if (isWebExtAvailable) return runner;
      else throw Error('Module not found: web-ext'); // TODO: make this realistic
    },
  };
});
const webExtRunner = createWebExtRunner();

vi.mock('../../src/core/runners/wsl', () => {
  const runner = createMockExtensionRunner('wsl');
  return { createWslRunner: () => runner };
});
const wslRunner = createWslRunner();

// Other mocks

vi.mock('is-wsl', () => ({
  get default() {
    return isWsl;
  },
}));

describe('Runners', () => {
  beforeEach(() => {
    isWsl = false;
    isWebExtAvailable = true;
  });

  describe('build', () => {
    const command = 'build';

    it('should use the manual runner as a placeholder since the runner is not used during builds', async () => {
      await TestProject.simple().registerWxt(command);

      expect(wxt.config.runner).toBe(manualRunner);
    });
  });

  describe('dev', () => {
    const command = 'serve';

    describe('inside WSL', () => {
      beforeEach(() => {
        isWsl = true;
      });

      it('should use the WSL runner', async () => {
        await TestProject.simple().registerWxt(command);

        expect(wxt.config.runner).toBe(wslRunner);
      });
    });

    describe('web-ext is installed', () => {
      it('should use the web-ext runner', async () => {
        await TestProject.simple().registerWxt(command);

        expect(wxt.config.runner).toBe(webExtRunner);
      });

      describe('disabled', () => {
        it('should use the manual runner', async () => {
          await TestProject.simple().registerWxt(command, {
            webExt: { disabled: true },
          });

          expect(wxt.config.runner).toBe(manualRunner);
        });
      });
    });

    describe('web-ext is not installed', () => {
      beforeEach(() => {
        isWebExtAvailable = false;
      });

      it('should use the web-ext runner', async () => {
        await TestProject.simple().registerWxt(command);

        expect(wxt.config.runner).toBe(manualRunner);
      });
    });

    describe('targeting safari', () => {
      it('should use the safari runner', async () => {
        await TestProject.simple().registerWxt(command, {
          browser: 'safari',
        });

        expect(wxt.config.runner).toBe(safariRunner);
      });
    });
  });
});
