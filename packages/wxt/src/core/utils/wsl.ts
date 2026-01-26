/**
 * Returns true when running on WSL or WSL2.
 */
export async function isWsl(): Promise<boolean> {
  const { default: isWsl } = await import('is-wsl'); // ESM only, requires dynamic import
  return isWsl;
}

/**
 * Returns true when a GUI display environment is available.
 * Checks for both X11 (DISPLAY) and Wayland (WAYLAND_DISPLAY) environments.
 */
export function hasGuiDisplay(): boolean {
  const display = process.env.DISPLAY;
  const waylandDisplay = process.env.WAYLAND_DISPLAY;
  return (
    (typeof display === 'string' && display.length > 0) ||
    (typeof waylandDisplay === 'string' && waylandDisplay.length > 0)
  );
}
