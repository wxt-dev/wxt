/**
 * Returns true when running on WSL or WSL2.
 */
export async function isWsl(): Promise<boolean> {
  const { default: isWsl } = await import('is-wsl'); // ESM only, requires dynamic import
  return isWsl;
}
