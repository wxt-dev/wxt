import { CAC, Command } from 'cac';
import consola, { LogLevels } from 'consola';
import { exec } from '~/core/utils/exec';
import { printHeader } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';
import { ValidationError } from '~/core/utils/validation';
import { registerWxt } from '~/core/wxt';

/**
 * Wrap an action handler to add a timer, error handling, and maybe enable debug mode.
 */
export function wrapAction(
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
      if (err instanceof ValidationError) {
        // Don't log these errors, they've already been logged
      } else {
        consola.error(err);
      }
      process.exit(1);
    }
  };
}

/**
 * Array flags, when not passed, are either `undefined` or `[undefined]`. This function filters out
 * the
 */
export function getArrayFromFlags<T>(
  flags: any,
  name: string,
): T[] | undefined {
  const array = [flags[name]].flat() as Array<T | undefined>;
  const result = array.filter((item) => item != null) as T[];
  return result.length ? result : undefined;
}

const aliasCommandNames = new Set<string>();
export function createAliasedCommand(
  base: CAC,
  name: string,
  alias: string,
  docsUrl: string,
) {
  const aliasedCommand = base
    .command(name, `Alias for ${alias} (${docsUrl})`)
    .allowUnknownOptions()
    .action(async () => {
      try {
        await registerWxt('build');

        const args = process.argv.slice(
          process.argv.indexOf(aliasedCommand.name) + 1,
        );
        await exec(alias, args, {
          stdio: 'inherit',
        });
      } catch {
        // Let the other aliased CLI log errors, just exit
        process.exit(1);
      }
    });
  aliasCommandNames.add(aliasedCommand.name);
}
export function isAliasedCommand(command: Command | undefined): boolean {
  return !!command && aliasCommandNames.has(command.name);
}
