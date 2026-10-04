/**
 * Returns the result of the first mapper function that resolves successfully.
 * If an error other than "module-not-found" is thrown, it is re-thrown
 * immediately.
 *
 * @param mappers - An array of functions that dynamically import a module and
 *   return a value based on it.
 * @returns The result of the first module that resolves successfully.
 */
export async function withFirstModule<T>(
  ...mappers: Array<() => Promise<NoInfer<T>> | NoInfer<T>>
): Promise<T> {
  for (const map of mappers) {
    try {
      return await map();
    } catch (err) {
      if (!isModuleNotFound(err)) throw err;
    }
  }
  throw Error('No optional modules found');
}

export async function tryImport<T>(
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    if (isModuleNotFound(err)) return undefined;
    throw err;
  }
}

const MODULE_NOT_FOUND_CODE = 'ERR_MODULE_NOT_FOUND';

function isModuleNotFound(err: any): boolean {
  return err?.code === MODULE_NOT_FOUND_CODE;
}
