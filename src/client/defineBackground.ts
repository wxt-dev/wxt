import { BackgroundScriptDefintition } from '..';

export function defineBackground(main: () => void): BackgroundScriptDefintition;
export function defineBackground(
  definition: BackgroundScriptDefintition,
): BackgroundScriptDefintition;
export function defineBackground(
  arg: (() => void) | BackgroundScriptDefintition,
): BackgroundScriptDefintition {
  if (typeof arg === 'function') return { main: arg };
  return arg;
}
