import fs from 'fs-extra';
import path from 'path';

export async function removeEmptyDirs(dir: string): Promise<void> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await removeEmptyDirs(filePath);
    }
  }

  try {
    await fs.rmdir(dir);
  } catch {
    // noop on failure - this means the directory was not empty.
  }
}
