import { BackgroundScriptDefintition } from '..';

export function defineBackgroundScript(
  main: () => void,
): BackgroundScriptDefintition;
export function defineBackgroundScript(
  definition: BackgroundScriptDefintition,
): BackgroundScriptDefintition;
export function defineBackgroundScript(
  arg: (() => void) | BackgroundScriptDefintition,
): BackgroundScriptDefintition {
  if (typeof arg === 'function') return { main: arg };
  return arg;
}
