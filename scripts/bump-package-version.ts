import {
  determineSemverChange,
  loadChangelogConfig,
  parseCommits,
  generateMarkDown,
  parseChangelogMarkdown,
} from 'changelogen';
import spawn from 'nano-spawn';
import { getPkgTag, grabPackageDetails, listCommitsInDir } from './git';
import { consola } from 'consola';
import fs from 'fs-extra';
import path from 'node:path';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: tsx bump-package-version.ts <package-name>',
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
await spawn('pnpm', ['version', bumpType], {
  cwd: pkgDir,
});
const updatedPkgJson = await fs.readJson(pkgJsonPath);
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
const { releases: prevReleases } = await fs
  .readFile(changelogPath, 'utf8')
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
await fs.writeFile(changelogPath, newChangelog, 'utf8');
consola.success('Updated changelog');

// Update WXT version in templates when releasing wxt package
const templatePkgJsonPaths: string[] = [];
if (pkg === 'wxt') {
  const templatesDir = 'templates';
  const templateDirs = await fs.readdir(templatesDir);
  for (const templateDir of templateDirs) {
    const templatePkgJsonPath = path.join(
      templatesDir,
      templateDir,
      'package.json',
    );
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
await spawn('git', [
  'add',
  pkgJsonPath,
  changelogPath,
  ...templatePkgJsonPaths,
]);
await spawn('git', [
  'commit',
  '-m',
  `chore(release): ${pkgName} v${newVersion}`,
]);
await spawn('git', ['tag', newTag]);
consola.success('Committed version and changelog');
