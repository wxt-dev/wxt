import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReloadContentScriptPayload } from '../../../utils/internal/dev-server-websocket';

type ContentScript = ReloadContentScriptPayload['contentScript'];
type Registered = ContentScript & { id: string };

const mockBrowser = vi.hoisted(() => ({
  runtime: {} as Record<string, unknown>,
  scripting: {} as Record<string, unknown>,
  tabs: {} as Record<string, unknown>,
}));

vi.mock('wxt/browser', () => ({ browser: mockBrowser }));

const {
  reloadContentScript,
  reloadManifestContentScriptMv3,
  waitForPendingContentScriptReloads,
} = await import('../reload-content-scripts');

const tick = () => new Promise((resolve) => setTimeout(resolve));

/**
 * Registering takes a few ticks and, like Chrome, rejects a second registration
 * of an ID that is registered or still registering, and rejects an update to an
 * ID that is not fully registered yet.
 */
function installFakeBrowser() {
  const registered = new Map<string, Registered>();
  const registering = new Set<string>();
  const executedTabs: number[] = [];
  const removedCss: Array<{ tabId: number; files: string[] }> = [];
  const insertedCss: Array<{ tabId: number; files: string[] }> = [];
  const failures = { registerOnce: false };

  mockBrowser.runtime = {
    getManifest: () => ({ manifest_version: 3 }),
  };
  mockBrowser.scripting = {
    async getRegisteredContentScripts() {
      await tick();
      return [...registered.values()];
    },
    async registerContentScripts(scripts: Registered[]) {
      if (failures.registerOnce) {
        failures.registerOnce = false;
        throw new Error('Failed to register');
      }
      for (const script of scripts) {
        if (registered.has(script.id) || registering.has(script.id)) {
          throw new Error(`Duplicate script ID '${script.id}'`);
        }
        registering.add(script.id);
      }
      await tick();
      await tick();
      for (const script of scripts) {
        registering.delete(script.id);
        registered.set(script.id, script);
      }
    },
    async updateContentScripts(scripts: Registered[]) {
      for (const script of scripts) {
        if (registering.has(script.id)) {
          throw new Error(
            `Content script '${script.id}' is not fully registered`,
          );
        }
        if (!registered.has(script.id)) {
          throw new Error(`Content script '${script.id}' does not exist`);
        }
      }
      await tick();
      for (const script of scripts) registered.set(script.id, script);
    },
    async executeScript({ target }: { target: { tabId: number } }) {
      executedTabs.push(target.tabId);
    },
    async removeCSS({
      target,
      files,
    }: {
      target: { tabId: number };
      files: string[];
    }) {
      removedCss.push({ tabId: target.tabId, files });
    },
    async insertCSS({
      target,
      files,
    }: {
      target: { tabId: number };
      files: string[];
    }) {
      insertedCss.push({ tabId: target.tabId, files });
    },
  };
  mockBrowser.tabs = {
    async query() {
      return [
        { id: 1, url: 'https://a.example/' },
        { id: 2, url: 'https://b.example/' },
        { id: 3, url: 'https://c.example/admin' },
        { id: 4, url: 'https://c.example/page' },
      ];
    },
  };

  return { registered, executedTabs, removedCss, insertedCss, failures };
}

const contentScript = (
  matches: string[],
  overrides?: Partial<ContentScript>,
): ContentScript => ({
  js: ['content-scripts/content.js'],
  matches,
  ...overrides,
});

describe('reloadManifestContentScriptMv3', () => {
  let fake: ReturnType<typeof installFakeBrowser>;

  beforeEach(() => {
    fake = installFakeBrowser();
  });

  it('registers a script that is not registered yet, then reloads its tabs', async () => {
    await reloadManifestContentScriptMv3(
      contentScript(['https://a.example/*']),
    );

    expect(
      fake.registered.get('wxt:content-scripts/content.js')?.matches,
    ).toEqual(['https://a.example/*']);
    expect(fake.executedTabs).toEqual([1]);
  });

  it('applies the later payload when two reloads of one script overlap', async () => {
    await Promise.all([
      reloadManifestContentScriptMv3(contentScript(['https://a.example/*'])),
      reloadManifestContentScriptMv3(contentScript(['https://b.example/*'])),
    ]);

    expect(
      fake.registered.get('wxt:content-scripts/content.js')?.matches,
    ).toEqual(['https://b.example/*']);
    // The first reload finishes before the second starts: tab 1 matches only the
    // first payload, tab 2 matches only the second.
    expect(fake.executedTabs).toEqual([1, 2]);
  });

  it('registers once and updates the registration when two reloads carry the same payload', async () => {
    const register = vi.spyOn(
      mockBrowser.scripting as { registerContentScripts: () => unknown },
      'registerContentScripts',
    );

    await Promise.all([
      reloadManifestContentScriptMv3(contentScript(['https://a.example/*'])),
      reloadManifestContentScriptMv3(contentScript(['https://a.example/*'])),
    ]);

    expect(register).toHaveBeenCalledTimes(1);
    expect(
      fake.registered.get('wxt:content-scripts/content.js')?.matches,
    ).toEqual(['https://a.example/*']);
    expect(fake.executedTabs).toEqual([1, 1]);
  });

  it('rejects the failed reload and still runs the reload queued behind it', async () => {
    fake.failures.registerOnce = true;

    const results = await Promise.allSettled([
      reloadManifestContentScriptMv3(contentScript(['https://a.example/*'])),
      reloadManifestContentScriptMv3(contentScript(['https://b.example/*'])),
    ]);

    expect(results[0]).toMatchObject({
      status: 'rejected',
      reason: new Error('Failed to register'),
    });
    expect(results[1].status).toBe('fulfilled');
    expect(
      fake.registered.get('wxt:content-scripts/content.js')?.matches,
    ).toEqual(['https://b.example/*']);
    expect(fake.executedTabs).toEqual([2]);
  });

  it('skips tabs that also match excludeMatches, even though they match matches', async () => {
    await reloadManifestContentScriptMv3(
      contentScript(['https://c.example/*'], {
        excludeMatches: ['https://c.example/admin*'],
      }),
    );

    // Tab 3 (c.example/admin) matches `matches` too, but must be skipped
    // because it also matches `excludeMatches`. Only tab 4 gets the script.
    expect(fake.executedTabs).toEqual([4]);
  });

  it('replaces previously-injected CSS instead of leaving the old CSS in place', async () => {
    await reloadManifestContentScriptMv3(
      contentScript(['https://a.example/*'], {
        css: ['content-scripts/content.css'],
      }),
    );

    expect(fake.removedCss).toEqual([
      { tabId: 1, files: ['content-scripts/content.css'] },
    ]);
    expect(fake.insertedCss).toEqual([
      { tabId: 1, files: ['content-scripts/content.css'] },
    ]);
    expect(fake.executedTabs).toEqual([1]);
  });
});

describe('reloadContentScript', () => {
  beforeEach(() => {
    installFakeBrowser();
  });

  it('does not leave an unhandled rejection when the underlying reload fails, and still lets pending reloads settle', async () => {
    mockBrowser.scripting.getRegisteredContentScripts = async () => {
      throw new Error('boom');
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    reloadContentScript({
      registration: 'manifest',
      contentScript: contentScript(['https://a.example/*']),
    });

    // Resolving (not rejecting) proves the rejection from the underlying
    // reload was caught, instead of leaking out through `.finally()`.
    await expect(waitForPendingContentScriptReloads()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
