import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWslRunner } from '../wsl';
import { setFakeWxt } from '../../utils/testing/fake-objects';

describe('createWslRunner', () => {
  const originalDisplay = process.env.DISPLAY;

  afterEach(() => {
    process.env.DISPLAY = originalDisplay;
  });

  it('should warn when running in WSL without WSLg', async () => {
    process.env.DISPLAY = ':0';
    const fake = setFakeWxt({
      config: {
        browser: 'chrome',
        outDir: '/tmp/wxt-out',
      },
    });

    const runner = createWslRunner();
    await runner.openBrowser();

    expect(fake.logger.warn).toHaveBeenCalledTimes(1);
  });
});
