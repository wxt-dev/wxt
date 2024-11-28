const eslintPackageName = 'eslint';

export async function getEslintVersion(): Promise<string[]> {
  try {
    const { version } = await import(eslintPackageName);
    return version.split('.') ?? [];
  } catch {
    // Return an empty version when there's an error importing ESLint
    return [];
  }
}
