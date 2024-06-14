import {
  createGithubRelease,
  loadChangelogConfig,
  parseChangelogMarkdown,
} from 'changelogen';
import fs from 'fs-extra';
import { grabPackageDetails } from './git';
import consola from 'consola';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: tsx create-github-release.ts <package-name>',
  );
}

const { pkgName, prevTag, currentVersion, changelogPath } =
  await grabPackageDetails(pkg);
consola.info('Creating release for:', { pkg, pkgName, prevTag });

const { releases } = await fs
  .readFile(changelogPath, 'utf8')
  .then(parseChangelogMarkdown)
  .catch(() => ({ releases: [] }));

const config = await loadChangelogConfig(process.cwd());
config.tokens.github = process.env.GITHUB_TOKEN;
await createGithubRelease(config, {
  tag_name: prevTag,
  name: `${pkgName} v${currentVersion}`,
  body: releases[0].body,
  // @ts-expect-error: Not typed in changelogen, but present: https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release
  make_latest: pkg === 'wxt',
});
consola.success('Created release');
