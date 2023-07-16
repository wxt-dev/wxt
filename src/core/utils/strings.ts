export function kebabCaseAlphanumeric(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '') // Remove all non-alphanumeric, non-hyphen characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}
