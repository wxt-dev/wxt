import { getInternalConfig } from '../../utils/getInternalConfig';
import { findEntrypoints } from '../../utils/findEntrypoints';
import { generateTypesDir } from '../../utils/generateTypesDir';
import { defineCommand } from '../utils/defineCommand';

export const prepare = defineCommand(
  async (root: any, { mode, config }: any) => {
    const internalConfig = await getInternalConfig(
      { root, mode, configFile: config },
      'build',
    );
    internalConfig.logger.info('Generating types...');

    const entrypoints = await findEntrypoints(internalConfig);
    await generateTypesDir(entrypoints, internalConfig);
  },
);
