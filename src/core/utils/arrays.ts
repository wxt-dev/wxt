/**
 * Checks if `predicate` returns truthy for all elements of the array.
 */
export function every<T>(
  array: T[],
  predicate: (item: T, index: number) => boolean,
): boolean {
  for (let i = 0; i < array.length; i++)
    if (!predicate(array[i], i)) return false;
  return true;
}
