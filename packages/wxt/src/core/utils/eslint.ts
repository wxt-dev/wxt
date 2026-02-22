export async function getEslintVersion(): Promise<string[]> {
  try {
    const { ESLint } = await import('eslint');
    return ESLint.version?.split('.') ?? [];
  } catch {
    // Return an empty version when there's an error importing ESLint
    return [];
  }
}
