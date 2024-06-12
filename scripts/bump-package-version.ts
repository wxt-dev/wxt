import {
  determineSemverChange,
  loadChangelogConfig,
  parseCommits,
  generateMarkDown,
  parseChangelogMarkdown,
} from 'changelogen';
import { execaCommand } from 'execa';
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
consola.info('Bumping:', { pkg, pkgDir, pkgName, currentVersion });

// Get commits
const config = await loadChangelogConfig(process.cwd());
consola.info('Config:', config);
const rawCommits = await listCommitsInDir(pkgDir);
const commits = parseCommits(rawCommits, config);

// Bump version
let bumpType = determineSemverChange(commits, config);
if (currentVersion.startsWith('0.')) {
  if (bumpType === 'major') {
    bumpType = 'minor';
  } else if (bumpType === 'minor') {
    bumpType = 'patch';
  }
}
await execaCommand(`pnpm version ${bumpType}`, {
  cwd: pkgDir,
});
const updatedPkgJson = await fs.readJson(pkgJsonPath);
const newVersion: string = updatedPkgJson.version;
consola.info('Bump:', { currentVersion, bumpType, newVersion });

// Generate changelog
const versionChangelog = await generateMarkDown(commits, config);
const { releases: prevReleases } = await fs
  .readFile(changelogPath, 'utf8')
  .then(parseChangelogMarkdown)
  .catch(() => ({ releases: [] }));
const allReleases = [
  {
    version: newVersion,
    body: versionChangelog,
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
await execaCommand(`git add ${pkgJsonPath} ${changelogPath}`);
await execaCommand(
  `git commit -m "chore(release): \\\`${pkgName}\\\` v${newVersion}"`,
);
await execaCommand(`git tag ${pkg}-v${newVersion}`);
