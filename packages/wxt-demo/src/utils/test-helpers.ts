import { expect } from 'vitest';
import { TestProject } from '../../../wxt/e2e/utils.ts';
import { readFile } from 'fs/promises';
import { resolve } from 'node:path';

const wxtDemoEntrypointsDir = resolve(import.meta.dirname, '..', 'entrypoints');

export const contentSource = await readFile(
  resolve(wxtDemoEntrypointsDir, 'content.ts'),
  'utf-8',
);
export const unlistedSource = await readFile(
  resolve(wxtDemoEntrypointsDir, 'unlisted.ts'),
  'utf-8',
);

function buildProject(browser: string, manifestVersion: 2 | 3) {
  const project = new TestProject();
  project.addFile('entrypoints/content.ts', contentSource);
  project.addFile('entrypoints/unlisted.ts', unlistedSource);
  project.setConfigFileConfig({
    manifest: {
      web_accessible_resources: [
        {
          resources: ['unlisted.js'],
          matches: ['*://*.example.com/*'],
        },
      ],
    },
  });

  return { project, build: project.build({ browser, manifestVersion }) };
}

export async function buildAndGetScriptsOutput(
  browser: string,
  manifestVersion: 2 | 3,
) {
  const { project, build } = buildProject(browser, manifestVersion);
  await build;

  const outputDir = `.output/${browser}-mv${manifestVersion}`;
  const contentJs = await readFile(
    project.resolvePath(`${outputDir}/content-scripts/content.js`),
    'utf-8',
  );
  const unlistedJs = await readFile(
    project.resolvePath(`${outputDir}/unlisted.js`),
    'utf-8',
  );
  return contentJs + unlistedJs;
}

export async function expectOutputContainsLogs(
  browser: string,
  manifestVersion: 2 | 3,
  expectedLogs: string[],
) {
  const output = await buildAndGetScriptsOutput(browser, manifestVersion);
  expect(
    expectedLogs.every((log) => output.includes(`console.log("${log}")`)),
  ).toBe(true);
}
