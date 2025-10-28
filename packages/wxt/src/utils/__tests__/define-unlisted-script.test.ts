import { describe, expect, it, vi } from 'vitest';
import { defineUnlistedScript } from '../define-unlisted-script';
import { UnlistedScriptDefinition } from '../../types';

describe('defineUnlistedScript', () => {
  it('should return the object definition when given an object', () => {
    const definition: UnlistedScriptDefinition = {
      include: [''],
      main: vi.fn(),
    };

    const actual = defineUnlistedScript(definition);

    expect(actual).toEqual(definition);
  });

  it('should return the object definition when given a main function', () => {
    const main = vi.fn();

    const actual = defineUnlistedScript(main);

    expect(actual).toEqual({ main });
  });

  it('should return the object definition when given a main function that returns a value', () => {
    const main = vi.fn(() => 'test');

    const actual = defineUnlistedScript(main);

    expect(actual).toEqual({ main });
    expect(actual.main()).eq('test');
  });

  it('should return the object definition when given a main function that returns a promise', async () => {
    const main = vi.fn(() => Promise.resolve('test'));

    const actual = defineUnlistedScript(main);

    expect(actual).toEqual({ main });
    await expect(actual.main()).resolves.toEqual('test');
  });
});
