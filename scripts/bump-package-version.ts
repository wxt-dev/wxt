import {
  determineSemverChange,
  getCurrentGitTag,
  getLastGitTag,
  loadChangelogConfig,
  parseCommits,
} from 'changelogen';
import { execa } from 'execa';
import { listCommitsInDir } from './git';
import { consola } from 'consola';

const pkg = process.argv[2];
if (pkg == null) {
  throw Error(
    'Package name missing. Usage: tsx bump-package-version.ts <package-name>',
  );
}
const pkgDir = `packages/${pkg}`;
const pkgJson = (await import(`../${pkgDir}/package.json`)).default;
const pkgName = pkgJson.name;
consola.info('Bumping:', { pkg, pkgDir, pkgName });

const config = await loadChangelogConfig(process.cwd());
config.templates.commitMessage = `chore(release): \`${pkgName}\` v{{newVersion}}`;
config.templates.tagMessage = `${pkgName} v{{newVersion}}`;
config.templates.tagBody = `${pkgName} v{{newVersion}}`;
consola.info('Config:', config);
const rawCommits = await listCommitsInDir(pkgDir);
const commits = parseCommits(rawCommits, config);
const nextVersion = determineSemverChange(commits, config);
console.log('Next version:', nextVersion);
