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
var importWebExtRunnerError: Error | undefined = undefined;

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
      if (!importWebExtRunnerError) return runner;
      else throw importWebExtRunnerError;
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

/**
 * Imitate a real module not found error - needs the correct `code` property.
 */
class ModuleNotFoundError extends Error {
  code = 'ERR_MODULE_NOT_FOUND';

  constructor(mod: string) {
    super(`Cannot find package '${mod}' imported from ...`);
    this.name = 'ModuleNotFoundError';
  }
}

describe('Runners', () => {
  beforeEach(() => {
    isWsl = false;
    importWebExtRunnerError = undefined;
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
        importWebExtRunnerError = new ModuleNotFoundError('web-ext');
      });

      it('should use the web-ext runner', async () => {
        await TestProject.simple().registerWxt(command);

        expect(wxt.config.runner).toBe(manualRunner);
      });
    });

    describe('some other error when importing the web-ext runner', () => {
      beforeEach(() => {
        importWebExtRunnerError = Error('test');
      });

      it('should throw the error', async () => {
        await expect(TestProject.simple().registerWxt(command)).rejects.toThrow(
          importWebExtRunnerError,
        );
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
