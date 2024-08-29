import prompts from 'prompts';
import { consola } from 'consola';
import { downloadTemplate } from 'giget';
import fs from 'fs-extra';
import path from 'node:path';
import pc from 'picocolors';
import { Formatter } from 'picocolors/types';

export async function initialize(options: {
  directory: string;
  template: string;
  packageManager: string;
}) {
  consola.info('Initalizing new project');

  const templates = await listTemplates();
  const defaultTemplate = templates.find(
    (template) => template.name === options.template?.toLowerCase().trim(),
  );

  const input = await prompts(
    [
      {
        name: 'directory',
        type: () => (options.directory == null ? 'text' : undefined),
        message: 'Project Directory',
        initial: options.directory,
      },
      {
        name: 'template',
        type: () => (defaultTemplate == null ? 'select' : undefined),
        message: 'Choose a template',
        choices: templates.map((template) => ({
          title:
            TEMPLATE_COLORS[template.name]?.(template.name) ?? template.name,
          value: template,
        })),
      },
      {
        name: 'packageManager',
        type: () => (options.packageManager == null ? 'select' : undefined),
        message: 'Package Manager',
        choices: [
          { title: pc.red('npm'), value: 'npm' },
          { title: pc.yellow('pnpm'), value: 'pnpm' },
          { title: pc.cyan('yarn'), value: 'yarn' },
          {
            title: `${pc.magenta('bun')}${pc.gray(' (experimental)')}`,
            value: 'bun',
          },
        ],
      },
    ],
    {
      onCancel: () => process.exit(1),
    },
  );
  input.directory ??= options.directory;
  input.template ??= defaultTemplate;
  input.packageManager ??= options.packageManager;

  const isExists = await fs.pathExists(input.directory);
  if (isExists) {
    const isEmpty = (await fs.readdir(input.directory)).length === 0;
    if (!isEmpty) {
      consola.error(
        `The directory ${path.resolve(input.directory)} is not empty. Aborted.`,
      );
      process.exit(1);
    }
  }
  await cloneProject(input);

  const cdPath = path.relative(process.cwd(), path.resolve(input.directory));
  console.log();
  consola.log(
    `✨ WXT project created with the ${
      TEMPLATE_COLORS[input.template.name]?.(input.template.name) ??
      input.template.name
    } template.`,
  );
  console.log();
  consola.log('Next steps:');
  let step = 0;
  if (cdPath !== '') consola.log(`  ${++step}.`, pc.cyan(`cd ${cdPath}`));
  consola.log(`  ${++step}.`, pc.cyan(`${input.packageManager} install`));
  console.log();
}

interface Template {
  /**
   * Template's name.
   */
  name: string;
  /**
   * Path to template directory in github repo.
   */
  path: string;
}

async function listTemplates(): Promise<Template[]> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/wxt-dev/wxt/contents/templates',
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    if (res.status >= 300)
      throw Error(`Request failed with status ${res.status} ${res.statusText}`);

    // Schema is Example4 of https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    const data = (await res.json()) as Array<{
      name: string;
      path: string;
      sha: string;
      size: number;
    }>;

    return data.sort((l, r) => {
      const lWeight = TEMPLATE_SORT_WEIGHT[l.name] ?? Number.MAX_SAFE_INTEGER;
      const rWeight = TEMPLATE_SORT_WEIGHT[r.name] ?? Number.MAX_SAFE_INTEGER;
      const diff = lWeight - rWeight;
      if (diff !== 0) return diff;
      return l.name.localeCompare(r.name);
    });
  } catch (err) {
    consola.error(err);
    throw Error(`Failed to load templates`);
  }
}

async function cloneProject({
  directory,
  template,
  packageManager,
}: {
  directory: string;
  template: Template;
  packageManager: string;
}) {
  const { default: ora } = await import('ora');
  const spinner = ora('Downloading template').start();
  try {
    // 1. Clone repo
    await downloadTemplate(`gh:wxt-dev/wxt/${template.path}`, {
      dir: directory,
      force: true,
    });

    // 2. Move _gitignore -> .gitignore
    await fs
      .move(
        path.join(directory, '_gitignore'),
        path.join(directory, '.gitignore'),
      )
      .catch((err) =>
        consola.warn('Failed to move _gitignore to .gitignore:', err),
      );

    spinner.succeed();
  } catch (err) {
    spinner.fail();
    throw Error(`Failed to setup new project: ${JSON.stringify(err, null, 2)}`);
  }
}

const TEMPLATE_COLORS: Record<string, Formatter> = {
  vanilla: pc.blue,
  vue: pc.green,
  react: pc.cyan,
  svelte: pc.red,
  solid: pc.blue,
};

const TEMPLATE_SORT_WEIGHT: Record<string, number> = {
  vanilla: 0,
  vue: 1,
  react: 2,
};
