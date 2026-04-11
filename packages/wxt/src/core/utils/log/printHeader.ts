import { version } from '../../../version';
import { consola } from 'consola';
import { styleText } from 'node:util';

export function printHeader() {
  consola.log(
    `\n${styleText('gray', 'WXT')} ${styleText(['bold', 'grey'], version)}`,
  );
}
