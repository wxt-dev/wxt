import { resolve } from 'node:path';
import consola from 'consola';

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
  const child = Bun.spawn({
    cmd: [...args, '--help'],
    cwd: 'packages/wxt',
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw Error(`Command failed with exit code ${exitCode}`);

  return await child.stdout.text();
}

function getWxtHelp(command: string): Promise<string> {
  return getHelp(`pnpm -s wxt ${command}`.trim());
}

async function getPublishExtensionHelp(command: string): Promise<string> {
  const res = await getHelp(
    `./node_modules/.bin/publish-extension ${command}`.trim(),
  );
  return res.replace(/\$ publish-extension/g, '$ wxt submit');
}

export interface Command {
  name: string;
  docs: string;
}
