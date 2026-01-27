import { describe, expect, it } from 'vitest';
import { createWslRunner } from '../wsl';
import { setFakeWxt } from '../../utils/testing/fake-objects';

describe('createWslRunner', () => {
  it('should warn when running in WSL without a GUI environment', async () => {
    const fake = setFakeWxt({
      config: {
        browser: 'chrome',
        outDir: '/tmp/wxt-out',
      },
    });

    const runner = createWslRunner();
    await runner.openBrowser();

    expect(fake.logger.warn).toHaveBeenCalledTimes(1);
    expect(fake.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Cannot auto-open browser when using WSL without a GUI environment',
      ),
    );
  });
});
