import consola from 'consola';
import spawn from 'nano-spawn';
import { resolve } from 'node:path';
import { version } from '../../../packages/wxt/package.json';

const cliDir = resolve('packages/wxt/src/cli/commands');
const cliDirGlob = resolve(cliDir, '**');

export default {
  watch: [cliDirGlob],
  async load() {
    consola.info(`Generating CLI docs`);

    const [wxt, build, zip, prepare, clean, init, submit, submitInit] =
      await Promise.all([
        getWxtHelp(''),
        getWxtHelp('build'),
        getWxtHelp('zip'),
        getWxtHelp('prepare'),
        getWxtHelp('clean'),
        getWxtHelp('init'),
        getPublishExtensionHelp(''),
        getPublishExtensionHelp('init'),
      ]);

    consola.success(`Generated CLI docs`);
    return {
      wxt,
      build,
      zip,
      prepare,
      clean,
      init,
      submit,
      submitInit,
    };
  },
};

async function getHelp(command: string): Promise<string> {
  const args = command.split(' ');
  const result = await spawn(args[0], [...args.slice(1), '--help'], {
    cwd: 'packages/wxt',
  });
  return result.stdout;
}

async function getWxtHelp(command: string): Promise<string> {
  const res = await getHelp(`bun run --silent wxt ${command}`.trim());
  return res.replaceAll('{{version}}', version);
}

async function getPublishExtensionHelp(command: string): Promise<string> {
  const res = await getHelp(
    `bun run --silent publish-extension ${command}`.trim(),
  );
  return res.replace(/\$ publish-extension/g, '$ wxt submit');
}

export interface Command {
  name: string;
  docs: string;
}
