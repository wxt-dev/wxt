import { styleText } from 'node:util';

import { consola } from 'consola';

import { version } from '../../version';

export function printHeader() {
  consola.log(
    `\n${styleText('gray', 'WXT')} ${styleText(['bold', 'gray'], version)}`,
  );
}
