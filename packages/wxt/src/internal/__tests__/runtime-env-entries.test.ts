import { describe, expect, it } from 'vitest';

import { fakeResolvedConfig } from '../../internal-utils/testing/fake-objects';
import { getRuntimeEnvEntries } from '../runtime-env-entries';

describe('getRuntimeEnvEntries', () => {
  it('should expose the raw --browser label, not the actual browser', () => {
    const config = fakeResolvedConfig({
      browser: 'ios',
      actualBrowser: 'safari',
    });

    const values = Object.fromEntries(
      getRuntimeEnvEntries(config).map((entry) => [entry.name, entry.value]),
    );

    // `BROWSER` and the per-browser booleans are documented as comparisons
    // against the target browser, so they must keep using the label even when
    // the actual browser is different.
    expect(values.BROWSER).toBe('ios');
    expect(values.SAFARI).toBe(false);
    expect(values.CHROME).toBe(false);
    expect(values.FIREFOX).toBe(false);
  });

  it('should keep the browser booleans keyed off the label', () => {
    const config = fakeResolvedConfig({
      browser: 'edge',
      actualBrowser: 'chromium',
    });

    const values = Object.fromEntries(
      getRuntimeEnvEntries(config).map((entry) => [entry.name, entry.value]),
    );

    expect(values.BROWSER).toBe('edge');
    expect(values.EDGE).toBe(true);
    expect(values.CHROME).toBe(false);
  });
});
