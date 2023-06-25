import { consola } from 'consola';
import { printHeader } from './printHeader';
import { formatDuration } from '../../utils/formatDuration';

export function defineCommand<TArgs extends any[]>(
  cb: (...args: TArgs) => void | boolean | Promise<void | boolean>,
) {
  return async (...args: TArgs) => {
    const startTime = Date.now();
    try {
      printHeader();

      const ongoing = await cb(...args);

      if (!ongoing)
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
