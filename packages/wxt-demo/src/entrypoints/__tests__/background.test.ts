import { beforeEach, describe, expect, it, vi } from 'vitest';
import background from '../background';

browser.i18n.getMessage = () => 'fake-message';

const logMock = vi.fn();
console.log = logMock;

describe('Background Entrypoint', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("should log the extension's runtime ID", () => {
    const ID = 'some-id';
    fakeBrowser.runtime.id = ID;

    background.main();

    expect(logMock).toBeCalledWith(ID);
  });

  it('should set the start time in storage', async () => {
    background.main();
    await new Promise((res) => setTimeout(res));

    expect(await storage.getItem('session:startTime')).toBeDefined();
  });
});
