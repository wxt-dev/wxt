import { getIsBackground } from './get-is-background';

let cached: boolean | undefined;

export function isBackground(): boolean {
  if (cached == null) cached = getIsBackground();
  return cached;
}
