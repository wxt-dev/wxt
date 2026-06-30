import { describe, it, expect, vi, type Mock } from 'vitest';
import { resolve } from 'node:path';
import type { Wxt, Entrypoint, WxtDirEntry } from 'wxt';
import module from '../index';

const FAKE_WXT_DIR = '/fake/.wxt';
const FAKE_OUT_DIR = '/fake/.output/chrome-mv3';
const FAKE_ROOT = '/fake';

interface MockWxt {
  config: {
    wxtDir: string;
    outDir: string;
    root: string;
    alias: Record<string, string>;
  };
  logger: { warn: Mock };
  hooks: { hook: Mock };
}

function makeMockWxt(): MockWxt {
  return {
    config: {
      wxtDir: FAKE_WXT_DIR,
      outDir: FAKE_OUT_DIR,
      root: FAKE_ROOT,
      alias: {},
    },
    logger: { warn: vi.fn() },
    hooks: { hook: vi.fn() },
  };
}

function getHook(wxt: MockWxt, name: string): (...args: unknown[]) => unknown {
  const call = wxt.hooks.hook.mock.calls.find((c) => c[0] === name);
  expect(call, `hook not registered: ${name}`).toBeDefined();
  return call![1];
}

function fakeEp(
  type: Entrypoint['type'],
  name: string,
  outputDir = FAKE_OUT_DIR,
): Entrypoint {
  return {
    type,
    name,
    inputPath: `/fake/entrypoints/${name}`,
    outputDir,
    options: {},
    skipped: false,
  } as unknown as Entrypoint;
}

describe('module setup', () => {
  it('registers #entrypoints alias on config:resolved', async () => {
    const wxt = makeMockWxt();
    await module.setup!(wxt as unknown as Wxt);

    const onConfigResolved = getHook(wxt, 'config:resolved');
    await onConfigResolved(wxt);

    expect(wxt.config.alias['#entrypoints']).toBe(
      resolve(FAKE_WXT_DIR, 'entrypoints.ts'),
    );
  });

  it('prepare:types receives a WxtDirFileEntry with generated content', async () => {
    const wxt = makeMockWxt();
    await module.setup!(wxt as unknown as Wxt);

    const onResolved = getHook(wxt, 'entrypoints:resolved');
    await onResolved(wxt, [
      fakeEp('popup', 'popup'),
      fakeEp('background', 'background'),
    ]);

    const entries: WxtDirEntry[] = [];
    const onPrepareTypes = getHook(wxt, 'prepare:types');
    await onPrepareTypes(wxt, entries);

    expect(entries).toHaveLength(1);
    const entry = entries[0] as { path: string; text: string };
    expect(entry.path).toBe('entrypoints.ts');
    expect(entry.text).toContain('ENTRYPOINT_POPUP');
    expect(entry.text).toContain('ENTRYPOINT_BACKGROUND');
  });

  it('skipped entrypoints are excluded from the generated file', async () => {
    const wxt = makeMockWxt();
    await module.setup!(wxt as unknown as Wxt);

    const onResolved = getHook(wxt, 'entrypoints:resolved');
    await onResolved(wxt, [
      fakeEp('popup', 'popup'),
      { ...fakeEp('content-script', 'overlay'), skipped: true },
    ]);

    const entries: WxtDirEntry[] = [];
    await getHook(wxt, 'prepare:types')(wxt, entries);

    const text = (entries[0] as { text: string }).text;
    expect(text).toContain('ENTRYPOINT_POPUP');
    expect(text).not.toContain('ENTRYPOINT_OVERLAY');
  });

  it('latest entrypoints:resolved wins when prepare:types fires', async () => {
    const wxt = makeMockWxt();
    await module.setup!(wxt as unknown as Wxt);

    const onResolved = getHook(wxt, 'entrypoints:resolved');
    await onResolved(wxt, [fakeEp('popup', 'popup')]);
    await onResolved(wxt, [fakeEp('background', 'background')]);

    const entries: WxtDirEntry[] = [];
    await getHook(wxt, 'prepare:types')(wxt, entries);

    const text = (entries[0] as { text: string }).text;
    expect(text).toContain('ENTRYPOINT_BACKGROUND');
    expect(text).not.toContain('ENTRYPOINT_POPUP');
  });
});
