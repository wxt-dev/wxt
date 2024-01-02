import { describe, expect, it } from 'vitest';
import { generateMainfest } from '../manifest';
import {
  fakeArray,
  fakeBuildOutput,
  fakeEntrypoint,
  fakeInternalConfig,
} from '../testing/fake-objects';

describe('Manifest Utils', () => {
  describe('generateManifest', () => {
    describe('Development reload command', () => {
      const reloadCommandName = 'wxt:reload-extension';
      const reloadCommand = {
        suggested_key: {
          default: 'Ctrl+E',
        },
      };

      it('should include a command for reloading the extension', async () => {
        const config = fakeInternalConfig({ command: 'serve' });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toMatchObject({
          [reloadCommandName]: reloadCommand,
        });
      });

      it('should not override any existing commands when adding the one to reload the extension', async () => {
        const customCommandName = 'custom-command';
        const customCommand = {
          description: 'Some other command',
          suggested_key: {
            default: 'Ctrl+H',
          },
        };
        const config = fakeInternalConfig({
          command: 'serve',
          manifest: {
            commands: {
              [customCommandName]: customCommand,
            },
          },
        });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toMatchObject({
          [reloadCommandName]: reloadCommand,
          [customCommandName]: customCommand,
        });
      });

      it('should not include the command when building an extension', async () => {
        const config = fakeInternalConfig({ command: 'build' });
        const output = fakeBuildOutput();
        const entrypoints = fakeArray(fakeEntrypoint);

        const actual = await generateMainfest(entrypoints, output, config);

        expect(actual.commands).toBeUndefined();
      });
    });
  });
});
