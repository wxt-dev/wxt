import { describe, expect, it, vi } from 'vitest';
import background from '../background';

browser.i18n.getMessage = () => 'fake-message';

const logMock = vi.fn();
console.log = logMock;

describe('Background Entrypoint', () => {
  it("should log the extenion's runtime ID", () => {
    const id = 'some-id';
    fakeBrowser.runtime.id = id;

    background.main();

    expect(logMock).toBeCalledWith(id);
  });
});
