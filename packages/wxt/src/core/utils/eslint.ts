export async function getEslintVersion(): Promise<string[] | undefined> {
  try {
    const require = (await import('node:module')).default.createRequire(
      import.meta.url,
    );
    const { ESLint } = require('eslint');
    return ESLint.version?.split('.') ?? undefined;
  } catch {
    // Return undefined when there's an error importing ESLint
    return undefined;
  }
}
