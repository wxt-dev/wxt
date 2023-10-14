import { UnlistedScriptDefinition } from '../../core/types';

export function defineUnlistedScript(
  main: () => void,
): UnlistedScriptDefinition;
export function defineUnlistedScript(
  definition: UnlistedScriptDefinition,
): UnlistedScriptDefinition;
export function defineUnlistedScript(
  arg: (() => void) | UnlistedScriptDefinition,
): UnlistedScriptDefinition {
  if (typeof arg === 'function') return { main: arg };
  return arg;
}
