import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

describe('TypeScript Project', () => {
  it('should generate defined constants correctly', async () => {
    const project = new TestProject();

    await project.build();

    const output = await project.serializeFile('.wxt/types/globals.d.ts');
    expect(output).toMatchInlineSnapshot(``);
  });

  it('should define auto-import globals', async () => {
    const project = new TestProject();

    await project.build();

    const output = await project.serializeFile('.wxt/types/imports.d.ts');
    expect(output).toMatchInlineSnapshot(``);
  });

  it('should augment the types for browser.runtime.getURL', async () => {
    const project = new TestProject();
    project.addFile('entrypoints/popup.html');
    project.addFile('entrypoints/options.html');
    project.addFile('entrypoints/sandbox.html');

    await project.build();

    const output = await project.serializeFile('.wxt/types/paths.d.ts');
    expect(output).toMatchInlineSnapshot(``);
  });
});
