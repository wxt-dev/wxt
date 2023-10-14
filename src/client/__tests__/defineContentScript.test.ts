import { describe, expect, it, vi } from 'vitest';
import { defineContentScript } from '../defineContentScript';
import { ContentScriptDefinition } from '../../core/types';

describe('defineContentScript', () => {
  it('should return the object passed in', () => {
    const definition: ContentScriptDefinition = {
      matches: [],
      include: [''],
      main: vi.fn(),
    };

    const actual = defineContentScript(definition);

    expect(actual).toEqual(definition);
  });
});
