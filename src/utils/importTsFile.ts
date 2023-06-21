import createJITI from 'jiti';

export async function importTsFile<T>(path: string): Promise<T> {
  const jiti = createJITI(__filename, {
    alias: {
      'webextension-polyfill': 'exvite',
    },
    cache: false,
    esmResolve: true,
    interopDefault: true,
  });
  try {
    return await jiti(path);
  } catch (err) {
    console.error(`Failed to import file: ${path}`, err);
    throw err;
  }
}
