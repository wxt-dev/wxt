import { consola } from 'consola';
import { printHeader } from './printHeader';

export function defineCommand(
  cb: (...args: any[]) => void | boolean | Promise<void | boolean>,
) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      printHeader();

      const ongoing = await cb(...args);

      if (!ongoing) consola.success(`Finished in ${Date.now() - startTime} ms`);
    } catch (err) {
      consola.fail(`Command failed after ${Date.now() - startTime} ms`);
      consola.error(err);
      process.exit(1);
    }
  };
}
