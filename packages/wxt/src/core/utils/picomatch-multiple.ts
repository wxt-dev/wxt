import picomatch, { PicomatchOptions } from 'picomatch';

/**
 * Run [`picomatch`](https://npmjs.com/package/picomatch) against multiple
 * patterns.
 *
 * Supports negated patterns, the order does not matter. If your `search` string
 * matches any of the negative patterns, it will return `false`.
 *
 * @example
 *   ```ts
 *   picomatchMultiple('a.json', ['*.json', '!b.json']); // => true
 *   picomatchMultiple('b.json', ['*.json', '!b.json']); // => false
 *   ```;
 */
export function picomatchMultiple(
  search: string,
  patterns: string[] | undefined,
  options?: PicomatchOptions,
): boolean {
  if (patterns == null) return false;

  const negatePatterns: string[] = [];
  const positivePatterns: string[] = [];
  for (const pattern of patterns) {
    if (pattern[0] === '!') negatePatterns.push(pattern.slice(1));
    else positivePatterns.push(pattern);
  }

  if (
    negatePatterns.some((negatePattern) =>
      picomatch(negatePattern, options)(search),
    )
  )
    return false;

  return positivePatterns.some((positivePattern) =>
    picomatch(positivePattern, options)(search),
  );
}
