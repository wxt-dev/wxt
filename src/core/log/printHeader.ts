import pc from 'picocolors';
import { version } from '../..';
import { consola } from 'consola';

export function printHeader() {
  console.log();
  consola.log(`${pc.gray('WXT')} ${pc.gray(pc.bold(version))}`);
}
