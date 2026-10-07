import type { Hookable } from 'hookable';
import type {
  ResolvedConfig,
  WxtBuilder,
  WxtDevServer,
  WxtHooks,
} from '../types';
import { ViteBuilder } from './builders/vite';
import { UnknownBuilder } from './builders/unknown';
import { withFirstModule } from '../internal-utils/module-utils';

export function detectBuilder(
  config: ResolvedConfig,
  hooks: Hookable<WxtHooks>,
  getWxtDevServer: () => WxtDevServer | undefined,
): Promise<WxtBuilder> {
  return withFirstModule(
    async () =>
      new ViteBuilder(await import('vite'), config, hooks, getWxtDevServer),
    () => new UnknownBuilder(),
  );
}
