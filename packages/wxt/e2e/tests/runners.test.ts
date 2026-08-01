import { expect, describe, vi, it, beforeEach } from 'vitest';
import { ExtensionRunner, WxtCommand } from '../../src';
import { createSafariRunner } from '../../src/core/runners/safari';
import { createManualRunner } from '../../src/core/runners/manual';
import { createWebExtRunner } from '../../src/core/runners/web-ext';
import { createWslRunner } from '../../src/core/runners/wsl';
import { TestProject } from '../utils';
import { wxt } from '../../src/core/wxt';

// Globals for modifying mock behaviors

let isWsl = false;
let importWebExtRunnerError: Error | undefined = undefined;

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

/** Imitate a real module not found error - needs the correct `code` property. */
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

  describe('config', () => {
    describe('Merging webExt sources', () => {
      const CONFIG_FILE_VALUE = 'config-file';
      const INLINE_VALUE = 'inline';
      const USER_VALUE = 'user';

      async function runTest(
        inline: boolean,
        configFile: boolean,
        user: boolean,
        expected: string,
      ) {
        const project = TestProject.simple();
        if (configFile)
          project.addFile(
            'web-ext.config.ts',
            `
            import { defineWebExtConfig } from 'wxt'

            export default defineWebExtConfig({
              src: "${CONFIG_FILE_VALUE}",
            })
          `,
          );
        if (user)
          project.addFile(
            'wxt.config.ts',
            `
            import { defineConfig } from 'wxt'

            export default defineConfig({
              webExt: {
                src: "${USER_VALUE}",
              }
            })
          `,
          );

        await project.prepare({
          // @ts-expect-error: Random fields should be allowed through
          webExt: inline ? { src: INLINE_VALUE } : {},
        });

        expect(wxt.config.webExt.config).toEqual({
          src: expected,
        });
      }

      it('should prioritize the inline config first', async () => {
        await runTest(true, true, true, INLINE_VALUE);
      });

      it('should prioritize the config file second', async () => {
        await runTest(false, true, true, CONFIG_FILE_VALUE);
      });

      it('should prioritize the user config third', async () => {
        await runTest(false, false, true, USER_VALUE);
      });
    });

    it.each<WxtCommand>(['build', 'serve'])(
      'should use the manual runner when disabled from web-ext.config.ts file for %s',
      async (cmd) => {
        const project = TestProject.simple();
        project.addFile(
          'web-ext.config.ts',
          `
          import { defineWebExtConfig } from 'wxt'

          export default defineWebExtConfig({
            disabled: true,
          })
        `,
        );
        await project.registerWxt(cmd);

        expect(wxt.config.runner).toBe(manualRunner);
      },
    );
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

      it('should use the manual runner', async () => {
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
