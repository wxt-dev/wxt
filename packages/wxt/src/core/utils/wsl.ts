// TODO: Someone smarter than me should just mock this module instead.
import isWsl_ from 'is-wsl';

/**
 * Returns true when running on WSL or WSL2.
 */
export function isWsl(): boolean {
  return isWsl_;
}
