export async function getEslintVersion(): Promise<string[]> {
  try {
    const require = (await import('node:module')).default.createRequire(
      import.meta.url,
    );
    const { ESLint } = require('eslint');
    return ESLint.version?.split('.') ?? [];
  } catch {
    // Return an empty version when there's an error importing ESLint
    return [];
  }
}
