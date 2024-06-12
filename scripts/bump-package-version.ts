import {
  determineSemverChange,
  loadChangelogConfig,
  parseCommits,
  generateMarkDown,
  parseChangelogMarkdown,
} from 'changelogen';
import { execa } from 'execa';
import { listCommitsInDir } from './git';
import { consola } from 'consola';
import fs from 'fs-extra';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: tsx bump-package-version.ts <package-name>',
  );
}
const pkgDir = `packages/${pkg}`;
const pkgJsonPath = `${pkgDir}/package.json`;
const changelogPath = `${pkgDir}/CHANGELOG.md`;
const pkgJson = await fs.readJson(pkgJsonPath);
const pkgName: string = pkgJson.name;
const currentVersion: string = pkgJson.version;
const prevTag = `${pkg}-v${currentVersion}`;
consola.info('Bumping:', { pkg, pkgDir, pkgName, currentVersion });

// Get commits
const config = await loadChangelogConfig(process.cwd());
consola.info('Config:', config);
const rawCommits = await listCommitsInDir(pkgDir, prevTag);
const commits = parseCommits(rawCommits, config);
consola.info(JSON.stringify(commits[0], null, 2));

// Bump version
let bumpType = determineSemverChange(commits, config) ?? 'patch';
if (currentVersion.startsWith('0.')) {
  if (bumpType === 'major') {
    bumpType = 'minor';
  } else if (bumpType === 'minor') {
    bumpType = 'patch';
  }
}
await execa('pnpm', ['version', bumpType], {
  cwd: pkgDir,
});
const updatedPkgJson = await fs.readJson(pkgJsonPath);
const newVersion: string = updatedPkgJson.version;
consola.info('Bump:', { currentVersion, bumpType, newVersion });

// Generate changelog
const versionChangelog = await generateMarkDown(commits, {
  ...config,
  from: currentVersion,
  to: newVersion,
});
const versionChangelogBody = versionChangelog
  .split('\n')
  .slice(1)
  .join('\n')
  .trim();
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

// Commit changes
await execa('git', ['add', pkgJsonPath, changelogPath]);
await execa('git', [
  'commit',
  '-m',
  `chore(release): ${pkgName} v${newVersion}`,
]);
await execa('git', ['tag', `${pkg}-v${newVersion}`]);
consola.success('Committed version and changelog');
