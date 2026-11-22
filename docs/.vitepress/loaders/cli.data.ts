import { resolve } from 'node:path';

import { version } from '../../../packages/wxt/package.json';

const cliDir = resolve('packages/wxt/src/cli/commands');
const cliDirGlob = resolve(cliDir, '**');

export default {
  watch: [cliDirGlob],
  async load() {
    console.info('Generating CLI docs');

    const [wxt, build, zip, prepare, clean, docs, init, submit, submitInit] =
      await Promise.all([
        getWxtHelp(''),
        getWxtHelp('build'),
        getWxtHelp('zip'),
        getWxtHelp('prepare'),
        getWxtHelp('clean'),
        getWxtHelp('docs'),
        getWxtHelp('init'),
        getPublishExtensionHelp(''),
        getPublishExtensionHelp('init'),
      ]);

    console.info('Generated CLI docs');
    return {
      wxt,
      build,
      zip,
      prepare,
      clean,
      docs,
      init,
      submit,
      submitInit,
    };
  },
};

async function getHelp(command: string): Promise<string> {
  const args = command.split(' ');
  const proc = Bun.spawn([...args, '--help'], {
    cwd: 'packages/wxt',
    stdout: 'pipe',
    stderr: 'inherit',
  });
  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  if (exitCode !== 0)
    throw Error(
      `\`${args.join(' ')} --help\` failed with exit code ${exitCode}`,
    );
  return stdout.trimEnd();
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
