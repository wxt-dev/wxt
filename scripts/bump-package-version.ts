import {
  determineSemverChange,
  generateMarkDown,
  loadChangelogConfig,
  parseChangelogMarkdown,
  parseCommits,
} from 'changelogen';
import { consola } from 'consola';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import spawn from 'nano-spawn';
import path from 'node:path';
import { getPkgTag, grabPackageDetails, listCommitsInDir } from './git';

const pkg = process.argv[2];
if (!pkg) {
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
const additionalDirs = pkg === 'wxt' ? ['docs'] : [];
const rawCommits = await listCommitsInDir(pkgDir, prevTag, additionalDirs);
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
const updatedPkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
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
const { releases: prevReleases } = await readFile(changelogPath, 'utf8')
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
await writeFile(changelogPath, newChangelog, 'utf8');
consola.success('Updated changelog');

// Update WXT version in templates when releasing wxt package
const templatePkgJsonPaths: string[] = [];
if (pkg === 'wxt') {
  const templatesDir = 'templates';
  const templateDirs = await readdir(templatesDir);
  for (const templateDir of templateDirs) {
    const templatePkgJsonPath = path.join(
      templatesDir,
      templateDir,
      'package.json',
    );
    try {
      const templatePkgJson = JSON.parse(
        await readFile(templatePkgJsonPath, 'utf-8'),
      );
      if (templatePkgJson.devDependencies?.wxt) {
        templatePkgJson.devDependencies.wxt = `^${newVersion}`;
        await writeFile(
          templatePkgJsonPath,
          JSON.stringify(templatePkgJson, null, 2),
        );
        templatePkgJsonPaths.push(templatePkgJsonPath);
        consola.success(`Updated wxt version in ${templatePkgJsonPath}`);
      }
    } catch {}
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
