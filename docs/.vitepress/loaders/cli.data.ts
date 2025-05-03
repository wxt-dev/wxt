import { resolve } from 'node:path';
import consola from 'consola';
import spawn from 'nano-spawn';

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
        getWxtSubmitHelp(''),
        getWxtSubmitHelp('init'),
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
  const res = await spawn(args[0], [...args.slice(1), '--help'], {
    cwd: 'packages/wxt',
  });
  return res.stdout;
}

function getWxtHelp(command: string): Promise<string> {
  return getHelp(`bun --silent wxt ${command}`.trim());
}

async function getWxtSubmitHelp(command: string): Promise<string> {
  const res = await getWxtHelp(`submit ${command}`);
  return res.replace(/\$ publish-extension/g, '$ wxt submit');
}

export interface Command {
  name: string;
  docs: string;
}
