import { describe, expect, it, vi } from 'bun:test';

import { ContentScriptDefinition } from '../../types';
import { defineContentScript } from '../define-content-script';

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
