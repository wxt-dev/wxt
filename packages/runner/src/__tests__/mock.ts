import { type Mock, vi } from 'bun:test';

export type MockProxy<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? T[K] & Mock<(...args: A) => R>
    : T[K];
} & T;

/**
 * Creates an object where every property that isn't explicitly provided is a
 * `vi.fn()`. Replaces `vitest-mock-extended`'s `mock`.
 */
export function mock<T>(partial: Partial<T> = {}): MockProxy<T> {
  const target: Record<PropertyKey, unknown> = { ...partial };
  return new Proxy(target, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return target[prop];
      if (!(prop in target)) target[prop] = vi.fn();
      return target[prop];
    },
  }) as MockProxy<T>;
}
