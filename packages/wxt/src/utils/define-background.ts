/** @module wxt/utils/define-background */
import type { BackgroundDefinition } from '../types';

export const defineBackground: {
  (main: () => void): BackgroundDefinition;
  (definition: BackgroundDefinition): BackgroundDefinition;
} = (arg: (() => void) | BackgroundDefinition): BackgroundDefinition => {
  if (arg == null || typeof arg === 'function') return { main: arg };
  return arg;
};
