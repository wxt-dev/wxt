import pc from 'picocolors';
import { version } from '../..';
import { consola } from 'consola';

export function printHeader() {
  consola.log(`\n${pc.dim('Exvite')} ${pc.dim(pc.bold(version))}`);
}
