import { version } from '../../../version';
import { consola } from 'consola';
import { color } from '../color';

export function printHeader() {
  consola.log(`\n${color.gray('WXT')} ${color.gray(color.bold(version))}`);
}
