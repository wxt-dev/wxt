//TODO Improve on this for mv2 & mv3 - test on browsers
/**
 * Returns true if the script is running in the background
 * @returns boolean
 */
export default function isBackground() {
  let isBackground = false;

  if (typeof window === 'undefined') {
    isBackground = true;
  }

  return isBackground;
}
