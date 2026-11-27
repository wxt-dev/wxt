/** Checks if `predicate` returns truthy for all elements of the array. */
export const every = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean,
): boolean => {
  for (let i = 0; i < array.length; i++)
    if (!predicate(array[i], i)) return false;
  return true;
};

/** Returns true when any of the predicates return true; */
export const some = <T>(
  array: T[],
  predicate: (item: T, index: number) => boolean,
): boolean => {
  for (let i = 0; i < array.length; i++)
    if (predicate(array[i], i)) return true;
  return false;
};

/** Convert an item or array to an array. */
export const toArray = <T>(a: T | T[]): T[] => {
  return Array.isArray(a) ? a : [a];
};

export const filterTruthy = <T>(array: Array<T | undefined>): T[] => {
  return array.filter((item) => !!item) as T[];
};
