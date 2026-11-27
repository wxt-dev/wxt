/** @module wxt/utils/define-unlisted-script */
import type { UnlistedScriptDefinition } from '../types';

export const defineUnlistedScript: {
  (main: () => void): UnlistedScriptDefinition;
  (definition: UnlistedScriptDefinition): UnlistedScriptDefinition;
} = (
  arg: (() => void) | UnlistedScriptDefinition,
): UnlistedScriptDefinition => {
  if (arg == null || typeof arg === 'function') return { main: arg };
  return arg;
};
