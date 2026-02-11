import {
  determineSemverChange,
  generateMarkDown,
  loadChangelogConfig,
  parseChangelogMarkdown,
  parseCommits,
} from 'changelogen';
import { consola } from 'consola';
import fs from 'fs-extra';
import { join } from 'node:path';
import { getPkgTag, grabPackageDetails, listCommitsInDir } from './git';

const pkg = process.argv[2];
if (!pkg) {
  throw Error(
    'Package name missing. Usage: bun run scripts/bump-package-version.ts <package-name>',
  );
}
const { pkgDir, pkgName, currentVersion, prevTag, changelogPath, pkgJsonPath } =
  await grabPackageDetails(pkg);
consola.info('Bumping:', { pkg, pkgDir, pkgName, currentVersion });

// Get commits
const config = await loadChangelogConfig(process.cwd());
consola.info('Config:', config);
const rawCommits = await listCommitsInDir(pkgDir, prevTag);
const commits = parseCommits(rawCommits, config);

// Bump version
const originalBumpType = determineSemverChange(commits, config) ?? 'patch';
let bumpType = originalBumpType;
if (currentVersion.startsWith('0.')) {
  if (bumpType === 'major') {
    bumpType = 'minor';
  } else if (bumpType === 'minor') {
    bumpType = 'patch';
  }
}
await Bun.$`bun --cwd "${pkgDir}" pm version ${bumpType}`;
const updatedPkgJson = await Bun.file(pkgJsonPath).json();
const newVersion: string = updatedPkgJson.version;
const newTag = getPkgTag(pkg, newVersion);
consola.info('Bump:', { currentVersion, bumpType, newVersion });

// Generate changelog
const versionChangelog = await generateMarkDown(commits, {
  ...config,
  from: prevTag,
  to: newTag,
});
let versionChangelogBody = versionChangelog
  .split('\n')
  .slice(1)
  .join('\n')
  .trim();
if (originalBumpType === 'major') {
  versionChangelogBody = versionChangelogBody.replace(
    '[compare changes]',
    `[⚠️ breaking changes](https://wxt.dev/guide/resources/upgrading.html) &bull; [compare changes]`,
  );
}
const { releases: prevReleases } = await Bun.file(changelogPath)
  .text()
  .then(parseChangelogMarkdown)
  .catch(() => ({ releases: [] }));
const allReleases = [
  {
    version: newVersion,
    body: versionChangelogBody,
  },
  ...prevReleases,
];

const newChangelog =
  '# Changelog\n\n' +
  allReleases
    .map((release) => [`## v${release.version}`, release.body].join('\n\n'))
    .join('\n\n');
await Bun.write(changelogPath, newChangelog);
consola.success('Updated changelog');

// Update WXT version in templates when releasing wxt package
const templatePkgJsonPaths: string[] = [];
if (pkg === 'wxt') {
  const templatesDir = 'templates';
  const templateDirs = await fs.readdir(templatesDir);
  for (const templateDir of templateDirs) {
    const templatePkgJsonPath = join(templatesDir, templateDir, 'package.json');
    if (await fs.pathExists(templatePkgJsonPath)) {
      const templatePkgJson = await fs.readJson(templatePkgJsonPath);
      if (templatePkgJson.devDependencies?.wxt) {
        templatePkgJson.devDependencies.wxt = `^${newVersion}`;
        await fs.writeJson(templatePkgJsonPath, templatePkgJson, { spaces: 2 });
        templatePkgJsonPaths.push(templatePkgJsonPath);
        consola.success(`Updated wxt version in ${templatePkgJsonPath}`);
      }
    }
  }
}

// Commit changes
await Bun.$`git add "${pkgJsonPath}" "${changelogPath}" ${templatePkgJsonPaths.join(' ')}`;
await Bun.$`git commit -m "chore(release): ${pkgName} v${newVersion}"`;
await Bun.$`git tag ${newTag}`;
consola.success('Committed version and changelog');
