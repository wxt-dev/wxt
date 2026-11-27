import { styleText } from 'node:util';

import { consola } from 'consola';

import { version } from '../../version';

export const printHeader = () => {
  consola.log(
    `\n${styleText('gray', 'WXT')} ${styleText(['bold', 'gray'], version)}`,
  );
};
