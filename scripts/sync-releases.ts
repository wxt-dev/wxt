import {
  getGithubReleaseByTag,
  loadChangelogConfig,
  parseChangelogMarkdown,
  updateGithubRelease,
} from 'changelogen';
import { getPkgTag, grabPackageDetails } from './git';
import consola from 'consola';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: bun run scripts/sync-releases.ts <package-name>',
  );
}

// Update
const { changelogPath, pkgName } = await grabPackageDetails(pkg);
const { releases } = await Bun.file(changelogPath)
  .text()
  .then(parseChangelogMarkdown)
  .catch(() => ({ releases: [] }));
const config = await loadChangelogConfig(process.cwd());
config.tokens.github = process.env.GITHUB_TOKEN;

// Update releases
for (const release of releases) {
  const tag = getPkgTag(pkg, release.version);
  try {
    const existing = await getGithubReleaseByTag(config, tag);
    if (existing.body !== release.body) {
      await updateGithubRelease(config, existing.id!, {
        tag_name: tag,
        name: `${pkgName} v${release.version}`,
        body: release.body,
      });
    }
    consola.success(`Synced \`${tag}\``);
  } catch (err) {
    consola.fail(`\`${tag}\``, err);
  }
}
consola.success('Done');
