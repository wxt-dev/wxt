/** @module wxt/utils/define-background */
import type { BackgroundDefinition } from '../client-types';

export function defineBackground(main: () => void): BackgroundDefinition;
export function defineBackground(
  definition: BackgroundDefinition,
): BackgroundDefinition;
export function defineBackground(
  arg: (() => void) | BackgroundDefinition,
): BackgroundDefinition {
  if (arg == null || typeof arg === 'function') return { main: arg };
  return arg;
}
