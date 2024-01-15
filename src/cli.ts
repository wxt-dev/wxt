import cac from 'cac';
import { version } from '~/version';
import { build, clean, createServer, initialize, prepare, zip } from '~/core';
import consola, { LogLevels } from 'consola';
import { printHeader } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';

// TODO: Remove. See https://github.com/wxt-dev/wxt/issues/277
process.env.VITE_CJS_IGNORE_WARNING = 'true';

const cli = cac('wxt');
cli.help();
cli.version(version);

cli.option('--debug', 'enable debug mode');

// DEV
cli
  .command('[root]', 'start dev server')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option(
    '-e, --filter-entrypoint <entrypoint>',
    'custom allowed entrypoints',
    {
      type: [],
    },
  )
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .action(
    wrapAction(async (root, flags) => {
      const server = await createServer({
        root,
        mode: flags.mode,
        browser: flags.browser,
        manifestVersion: flags.mv3 ? 3 : flags.mv2 ? 2 : undefined,
        configFile: flags.config,
        debug: flags.debug,
        filterEntrypoints: flags.filterEntrypoints,
      });
      await server.start();
      return { isOngoing: true };
    }),
  );

// BUILD
cli
  .command('build [root]', 'build for production')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option(
    '-e, --filter-entrypoint <entrypoint>',
    'custom allowed entrypoints',
    {
      type: [],
    },
  )
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .option('--analyze', 'visualize extension bundle')
  .action(
    wrapAction(async (root, flags) => {
      await build({
        root,
        mode: flags.mode,
        browser: flags.browser,
        manifestVersion: flags.mv3 ? 3 : flags.mv2 ? 2 : undefined,
        configFile: flags.config,
        debug: flags.debug,
        analysis: {
          enabled: flags.analyze,
        },
        filterEntrypoints: flags.filterEntrypoints,
      });
    }),
  );

// ZIP
cli
  .command('zip [root]', 'build for production and zip output')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .action(
    wrapAction(async (root, flags) => {
      await zip({
        root,
        mode: flags.mode,
        browser: flags.browser,
        manifestVersion: flags.mv3 ? 3 : flags.mv2 ? 2 : undefined,
        configFile: flags.config,
        debug: flags.debug,
      });
    }),
  );

// PREPARE
cli
  .command('prepare [root]', 'prepare typescript project')
  .option('-c, --config <file>', 'use specified config file')
  .action(
    wrapAction(async (root, flags) => {
      await prepare({
        root,
        configFile: flags.config,
        debug: flags.debug,
      });
    }),
  );

// CLEAN
cli
  .command('clean [root]', 'clean generated files and caches')
  .alias('cleanup')
  .action(
    wrapAction(async (root, flags) => {
      await clean(root);
    }),
  );

// INIT
cli
  .command('init [directory]', 'initialize a new project')
  .option('-t, --template <template>', 'template to use')
  .option('--pm <packageManager>', 'which package manager to use')
  .action(
    wrapAction(
      async (directory, flags) => {
        await initialize({
          directory,
          template: flags.template,
          packageManager: flags.pm,
        });
      },
      { disableFinishedLog: true },
    ),
  );

cli.parse();

/**
 * Wrap an action handler to add a timer, error handling, and maybe enable debug mode.
 */
function wrapAction(
  cb: (
    ...args: any[]
  ) => void | { isOngoing?: boolean } | Promise<void | { isOngoing?: boolean }>,
  options?: {
    disableFinishedLog?: boolean;
  },
) {
  return async (...args: any[]) => {
    // Enable consola's debug mode globally at the start of all commands when the `--debug` flag is
    // passed
    const isDebug = !!args.find((arg) => arg?.debug);
    if (isDebug) {
      consola.level = LogLevels.debug;
    }

    const startTime = Date.now();
    try {
      printHeader();

      const status = await cb(...args);

      if (!status?.isOngoing && !options?.disableFinishedLog)
        consola.success(
          `Finished in ${formatDuration(Date.now() - startTime)}`,
        );
    } catch (err) {
      consola.fail(
        `Command failed after ${formatDuration(Date.now() - startTime)}`,
      );
      consola.error(err);
      process.exit(1);
    }
  };
}
