import type { BackgroundDefinition } from '~/types';

export function defineBackground(main: () => void): BackgroundDefinition;
export function defineBackground(
  definition: BackgroundDefinition,
): BackgroundDefinition;
export function defineBackground(
  arg: (() => void) | BackgroundDefinition,
): BackgroundDefinition {
  if (typeof arg === 'function') return { main: arg };
  return arg;
}
