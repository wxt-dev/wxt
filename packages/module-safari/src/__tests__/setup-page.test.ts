import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  resizeMacWindow,
  resolveAppPaths,
  setupPageHtml,
  setupPageScript,
  writeSetupPage,
} from '../setup-page';

describe('setupPageHtml', () => {
  it('names the extension in both platforms’ instructions', () => {
    const html = setupPageHtml('Blocker for Twitter');
    expect(html).toContain('<h1>Blocker for Twitter</h1>');
    expect(html).toContain('platform-mac');
    expect(html).toContain('platform-ios');
    expect(html).toContain('Apps → Safari → Extensions');
  });

  it('escapes a name that would otherwise inject markup', () => {
    const html = setupPageHtml('Tom & Jerry <script>alert(1)</script>');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Tom &amp; Jerry &lt;script&gt;');
  });

  it('keeps the CSP and the relative asset paths the converter expects', () => {
    const html = setupPageHtml('X');
    expect(html).toContain(`content="default-src 'self'"`);
    expect(html).toContain('href="../Style.css"');
    expect(html).toContain('src="../Script.js"');
    expect(html).toContain('src="../Icon.png"');
  });
});

describe('setupPageScript', () => {
  const evaluate = (
    script: string,
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  ) => {
    const classes = new Set<string>();
    const body = {
      classList: {
        add: (c: string) => classes.add(c),
        remove: (c: string) => classes.delete(c),
        toggle: (c: string, on: boolean) =>
          on ? classes.add(c) : classes.delete(c),
      },
      get className() {
        return [...classes].join(' ');
      },
    };
    const document = {
      body,
      querySelectorAll: () => [],
      querySelector: () => null,
    };
    const fn = new Function(
      'document',
      'navigator',
      'webkit',
      `${script}; return show`,
    );
    return {
      show: fn(document, { userAgent }, {}) as (...args: unknown[]) => void,
      classes,
    };
  };

  it('reads the three-argument form a macOS/iOS project uses', () => {
    const { show, classes } = evaluate(setupPageScript());
    show('mac', true, true);
    expect(classes).toContain('platform-mac');
    expect(classes).toContain('state-on');
  });

  it('reads the two-argument form a single-platform project uses', () => {
    const { show, classes } = evaluate(setupPageScript());
    show(false, true);
    expect(classes).toContain('platform-mac');
    expect(classes).toContain('state-off');
  });

  it('shows iOS content with no extension state (iOS cannot query it)', () => {
    const { show, classes } = evaluate(setupPageScript());
    show('ios');
    expect(classes).toContain('platform-ios');
    expect(classes).not.toContain('state-on');
    expect(classes).not.toContain('state-off');
  });

  it('picks a platform on its own when native never calls show()', () => {
    const { classes } = evaluate(setupPageScript());
    expect(classes).toContain('platform-mac');
    expect(classes).not.toContain('state-on');
    expect(classes).not.toContain('state-off');
  });

  it('falls back to iOS on an iOS user agent', () => {
    const { classes } = evaluate(
      setupPageScript(),
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    );
    expect(classes).toContain('platform-ios');
    expect(classes).not.toContain('platform-mac');
  });

  it('lets a later native show() refine the state it seeded', () => {
    const { show, classes } = evaluate(setupPageScript());
    expect(classes).toContain('platform-mac');
    show(true, true);
    expect(classes).toContain('platform-mac');
    expect(classes).toContain('state-on');
  });
});

describe('resizeMacWindow', () => {
  it('grows every height the converter wrote at the placeholder size', () => {
    const storyboard =
      '<rect key="contentRect" height="325"/><rect key="frame" height="325"/>';
    expect(resizeMacWindow(storyboard)).toBe(
      '<rect key="contentRect" height="480"/><rect key="frame" height="480"/>',
    );
  });

  it('leaves other heights alone', () => {
    expect(resizeMacWindow('<rect height="1027"/>')).toBe(
      '<rect height="1027"/>',
    );
  });
});

describe('resolveAppPaths / writeSetupPage', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'wxt-safari-setup-page-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('finds the grouped layout a macOS+iOS conversion produces', async () => {
    await mkdir(join(root, 'Shared (App)', 'Resources', 'Base.lproj'), {
      recursive: true,
    });
    const paths = await resolveAppPaths(root, 'My Ext');
    expect(paths?.resources).toBe(join(root, 'Shared (App)', 'Resources'));
    expect(paths?.macStoryboard).toBe(
      join(root, 'macOS (App)', 'Base.lproj', 'Main.storyboard'),
    );
  });

  it('finds the flat layout a single-platform conversion produces', async () => {
    await mkdir(join(root, 'My Ext', 'Resources', 'Base.lproj'), {
      recursive: true,
    });
    const paths = await resolveAppPaths(root, 'My Ext');
    expect(paths?.resources).toBe(join(root, 'My Ext', 'Resources'));
    expect(paths?.macStoryboard).toBe(
      join(root, 'My Ext', 'Base.lproj', 'Main.storyboard'),
    );
  });

  it('reports failure instead of throwing when neither layout is present', async () => {
    expect(await resolveAppPaths(root, 'My Ext')).toBeUndefined();
    expect(
      await writeSetupPage({ projectName: 'My Ext', projectRoot: root }),
    ).toBe(false);
  });

  it('replaces all three resources and resizes the macOS window', async () => {
    await mkdir(join(root, 'Shared (App)', 'Resources', 'Base.lproj'), {
      recursive: true,
    });
    await mkdir(join(root, 'macOS (App)', 'Base.lproj'), { recursive: true });
    const storyboard = join(
      root,
      'macOS (App)',
      'Base.lproj',
      'Main.storyboard',
    );
    await writeFile(storyboard, '<rect key="contentRect" height="325"/>');

    expect(
      await writeSetupPage({ projectName: 'My Ext', projectRoot: root }),
    ).toBe(true);

    expect(
      await readFile(
        join(root, 'Shared (App)', 'Resources', 'Base.lproj', 'Main.html'),
        'utf-8',
      ),
    ).toContain('<h1>My Ext</h1>');
    expect(
      await readFile(
        join(root, 'Shared (App)', 'Resources', 'Style.css'),
        'utf-8',
      ),
    ).toContain('.platform-ios');
    expect(
      await readFile(
        join(root, 'Shared (App)', 'Resources', 'Script.js'),
        'utf-8',
      ),
    ).toContain('function show(');
    expect(await readFile(storyboard, 'utf-8')).toContain('height="480"');
  });

  it('skips the storyboard step for an iOS-only project', async () => {
    await mkdir(join(root, 'Shared (App)', 'Resources', 'Base.lproj'), {
      recursive: true,
    });
    expect(
      await writeSetupPage({ projectName: 'My Ext', projectRoot: root }),
    ).toBe(true);
  });
});
