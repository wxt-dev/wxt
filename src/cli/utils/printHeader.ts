import pc from 'picocolors';
import { version } from '../..';
import { consola } from 'consola';

export function printHeader() {
  consola.log(`\n${pc.gray('WXT')} ${pc.gray(pc.bold(version))}`);
}
