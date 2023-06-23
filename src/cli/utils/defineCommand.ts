import { consola } from 'consola';
import { printHeader } from './printHeader';

export function defineCommand(cb: (...args: any[]) => void | Promise<void>) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      printHeader();

      await cb(...args);

      consola.success(`Done in ${Date.now() - startTime} ms`);
    } catch (err) {
      consola.fail(`Command failed after ${Date.now() - startTime} ms`, err);
      process.exit(1);
    }
  };
}
