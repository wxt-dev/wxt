import { LogLevels, consola } from 'consola';
import { printHeader } from './log';
import { formatDuration } from './time';

export function defineCommand<TArgs extends any[]>(
  cb: (...args: TArgs) => void | boolean | Promise<void | boolean>,
  options?: {
    disableFinishedLog?: boolean;
  },
) {
  return async (...args: TArgs) => {
    // Enable consola's debug mode globally at the start of all commands when the `--debug` flag is
    // passed
    const isDebug = !!args.find((arg) => arg?.debug);
    if (isDebug) {
      consola.level = LogLevels.debug;
    }

    const startTime = Date.now();
    try {
      printHeader();

      const ongoing = await cb(...args);

      if (!ongoing && !options?.disableFinishedLog)
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
