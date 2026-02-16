import { RawGitCommit, getGitDiff } from 'changelogen';
import { consola } from 'consola';
import fs from 'fs-extra';

export async function grabPackageDetails(pkg: string) {
  const pkgDir = `packages/${pkg}`;
  const pkgJsonPath = `${pkgDir}/package.json`;
  const pkgJson = await fs.readJson(pkgJsonPath);
  const currentVersion: string = pkgJson.version;
  return {
    pkgDir,
    pkgJsonPath,
    changelogPath: `${pkgDir}/CHANGELOG.md`,
    pkgJson,
    pkgName: pkgJson.name,
    currentVersion,
    prevTag: getPkgTag(pkg, currentVersion),
  };
}

export function getPkgTag(pkg: string, version: string | undefined) {
  return `${pkg}-v${version}`;
}

export async function listCommitsInDir(
  dir: string,
  lastTag: string,
  additionalDirs: string[] = [],
): Promise<RawGitCommit[]> {
  const allDirs = [dir, ...additionalDirs];
  consola.info('Listing commits:', { lastTag, dirs: allDirs });
  const commits = await getGitDiff(lastTag);
  consola.info('All commits:', commits.length);
  consola.debug(commits);
  // commit.body contains all the files that were modified/added. So just check to make sure "\t" + "packages/storage" + "/" is in the body to include
  // '"\n\nM\tpackages/wxt/vitest.config.ts\n"'
  const filtered = commits.filter((commit) =>
    allDirs.some((dir) => commit.body.includes(`\t${dir}/`)),
  );
  consola.info('Filtered:', filtered.length);
  consola.debug(filtered);
  return filtered;
}
