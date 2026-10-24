import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReloadContentScriptPayload } from '../../../utils/internal/dev-server-websocket';

type ContentScript = ReloadContentScriptPayload['contentScript'];
type Registered = ContentScript & { id: string };

const mockBrowser = vi.hoisted(() => ({
  scripting: {} as Record<string, unknown>,
  tabs: {} as Record<string, unknown>,
}));

vi.mock('wxt/browser', () => ({ browser: mockBrowser }));

const { reloadManifestContentScriptMv3 } =
  await import('../reload-content-scripts');

const tick = () => new Promise((resolve) => setTimeout(resolve));

/**
 * Registering takes a few ticks and, like Chrome, rejects a second registration
 * of an ID that is registered or still registering, and rejects an update to an
 * ID that is not fully registered yet.
 */
function installFakeBrowser() {
  const registered = new Map<string, Registered>();
  const registering = new Set<string>();
  const reloadedTabs: number[] = [];
  const failures = { registerOnce: false };

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
  };
  mockBrowser.tabs = {
    async query() {
      return [
        { id: 1, url: 'https://a.example/' },
        { id: 2, url: 'https://b.example/' },
      ];
    },
    async reload(tabId: number) {
      reloadedTabs.push(tabId);
    },
  };

  return { registered, reloadedTabs, failures };
}

const contentScript = (matches: string[]): ContentScript => ({
  js: ['content-scripts/content.js'],
  matches,
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
    expect(fake.reloadedTabs).toEqual([1]);
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
    expect(fake.reloadedTabs).toEqual([1, 2]);
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
    expect(fake.reloadedTabs).toEqual([1, 1]);
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
    expect(fake.reloadedTabs).toEqual([2]);
  });
});
