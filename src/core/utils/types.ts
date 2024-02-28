/**
 * Remove optional from key, but keep undefined if present
 *
 * @example
 * type Test = NullablyRequired<{a?: string, b: number}>
 * // type Test = {a: string | undefined, b: number}
 */
export type NullablyRequired<T> = { [K in keyof Required<T>]: T[K] };
