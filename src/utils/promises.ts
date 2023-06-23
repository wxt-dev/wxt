/**
 * Add a timeout to a promise.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  duration: number,
): Promise<T> {
  return new Promise((res, rej) => {
    const timeout = setTimeout(() => {
      rej(`Promise timed out after ${duration}ms`);
    }, duration);
    promise
      .then(res)
      .catch(rej)
      .finally(() => clearTimeout(timeout));
  });
}

/**
 * @deprecated Don't use in production, just for testing and slowing things down.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
