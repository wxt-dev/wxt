import {
  getGithubReleaseByTag,
  loadChangelogConfig,
  parseChangelogMarkdown,
  updateGithubRelease,
} from 'changelogen';
import { getPkgTag, grabPackageDetails } from './git';
import fs from 'fs-extra';
import consola from 'consola';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: tsx sync-releases.ts <package-name>',
  );
}

// Update
const { changelogPath, pkgName } = await grabPackageDetails(pkg);
const { releases } = parseChangelogMarkdown(
  await fs.readFile(changelogPath, 'utf8'),
);
const config = await loadChangelogConfig(process.cwd());
config.tokens.github = process.env.GITHUB_TOKEN;

// Update releases
for (const release of releases) {
  const tag = getPkgTag(pkg, release.version);
  const existing = await getGithubReleaseByTag(config, tag);
  if (existing.body !== release.body) {
    await updateGithubRelease(config, existing.id!, {
      tag_name: tag,
      name: `${pkgName} v${release.version}`,
      body: release.body,
    });
  }
  consola.success(`Synced \`${tag}\``);
}
consola.success('Done');
