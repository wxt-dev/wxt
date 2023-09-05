import fs from 'fs-extra';

/**
 * Only write the contents to a file if it results in a change. This prevents unnecessary file
 * watchers from being triggered, like WXT's dev server or the TS language server in editors.
 *
 * @param file The file to write to.
 * @param newContents The new text content to write.
 */
export async function writeFileIfDifferent(
  file: string,
  newContents: string,
): Promise<void> {
  const existingContents = await fs
    .readFile(file, 'utf-8')
    .catch(() => undefined);

  if (existingContents !== newContents) {
    await fs.writeFile(file, newContents);
  }
}
