import glob from 'fast-glob';
import fs from 'fs-extra';
import * as semver from 'semver';
import { dirname } from 'node:path';
import consola from 'consola';
import spawn from 'nano-spawn';

const HELP_MESSAGE = `
Upgrades dependencies throughout WXT using custom rules.

Usage:
  pnpm tsx scripts/upgrade-deps.ts [options]

Options:
  --write, -w       Write changes to package.json files
  --major, -m       Allow major version upgrades
  --dev-only, -d    Only check/upgrade dev dependencies
  --prod-only, -p   Only check/upgrade production dependencies
  --help, -h        Display this help message
`.slice(1, -1);

const IGNORED_PACKAGES = [
  // Very touchy, don't change:
  'typedoc',
  'typedoc-plugin-markdown',
  'typedoc-vitepress-theme',
  // Manually manage version so a single version is used:
  'esbuild',
  // Maintained manually to match min-node version
  '@types/node',
  // License changed in newer versions
  'ua-parser-js',
];

await main();

async function main(): Promise<never> {
  const args = process.argv.slice(2);
  const isHelp = ['-h', '--help'].some((arg) => args.includes(arg));
  const isWrite = ['-w', '--write'].some((arg) => args.includes(arg));
  const isDevOnly = ['-d', '--dev-only'].some((arg) => args.includes(arg));
  const isProdOnly = ['-p', '--prod-only'].some((arg) => args.includes(arg));

  if (isHelp) {
    console.log(HELP_MESSAGE);
    process.exit(0);
  }

  const { packageJsonFiles, dependencyVersionsMap } =
    await getPackageJsonDependencies(isDevOnly, isProdOnly);
  const dependencyVersionMap = validateNoMultipleVersions(
    dependencyVersionsMap,
  );

  consola.start(
    `Fetching ${Object.keys(dependencyVersionsMap).length} dependencies...`,
  );
  const dependencies = await fetchAllPackageInfos(dependencyVersionMap);
  consola.success('Done!');

  const isMajor = ['-m', '--major'].some((arg) => args.includes(arg));
  const upgrades = await detectUpgrades(dependencies, isMajor);

  if (upgrades.length === 0) {
    console.log();
    consola.info("No upgrades found, you're up to date!");
    console.log();
    process.exit(0);
  }

  printUpgrades(upgrades);

  if (!isWrite) {
    consola.info('Run with `-w` to write changes to package.json files');
    console.log();
    process.exit(0);
  }

  consola.start('Writing new versions to package.json files...');
  await writeUpgrades(packageJsonFiles, upgrades);
  consola.success('Done!');
  console.log();
  consola.info('Run `pnpm i` to install new dependencies');
  console.log();
  process.exit(0);
}

type DependencyVersionsMap = Record<string, Set<string>>;
type PackageJsonData = {
  content: any;
  path: string;
  folder: string;
};

async function getPackageJsonDependencies(
  isDevOnly: boolean,
  isProdOnly: boolean,
): Promise<{
  packageJsonFiles: string[];
  dependencyVersionsMap: DependencyVersionsMap;
}> {
  const packageJsonFiles = await glob(
    ['package.json', '*/*/package.json', '!**/node_modules'],
    { onlyFiles: true },
  );
  const packageJsons: PackageJsonData[] = await Promise.all(
    packageJsonFiles.map(async (path) => ({
      content: await fs.readJson(path),
      path,
      folder: dirname(path),
    })),
  );

  const dependencyVersionsMap = packageJsons.reduce<DependencyVersionsMap>(
    (map, { content }) => {
      const addToMap = ([name, version]: [string, any]) => {
        if (
          name === 'wxt' ||
          version.startsWith('workspace:') ||
          IGNORED_PACKAGES.includes(name)
        )
          return;

        map[name] ||= new Set();
        map[name].add(version as string);
      };
      if (!isDevOnly)
        Object.entries(content.dependencies || {}).forEach(addToMap);
      if (!isProdOnly)
        Object.entries(content.devDependencies || {}).forEach(addToMap);
      return map;
    },
    {},
  );

  return {
    packageJsonFiles,
    dependencyVersionsMap,
  };
}

type DependencyVersionMap = Record<string, string>;

function validateNoMultipleVersions(
  dependencyVersionsMap: DependencyVersionsMap,
): DependencyVersionMap {
  const depsWithMultipleVersions = Object.entries(dependencyVersionsMap).filter(
    ([_, versions]) => versions.size > 1,
  );
  if (depsWithMultipleVersions.length === 0) {
    return Object.fromEntries(
      Object.entries(dependencyVersionsMap).map(([name, versions]) => [
        name,
        [...versions][0],
      ]),
    );
  }

  const maxWidth = Math.max(
    ...depsWithMultipleVersions.map(([name]) => name.length),
  );
  console.log(maxWidth);
  const addCyan = (text: string) => `\x1b[36m${text}\x1b[0m`;

  consola.info('Found multiple versions of:');
  for (const [name, versions] of depsWithMultipleVersions) {
    console.log(
      `    \x1b[35m${name.padEnd(maxWidth)}\x1b[0m  ${Array.from(versions)
        .map(addCyan)
        .join('\t')}`,
    );
  }
  consola.error(`${depsWithMultipleVersions.length} problem(s) found`);
  process.exit(1);
}

async function fetchPackageInfo(name: string): Promise<PackageInfo> {
  // Use PNPM instead of API in case dependencies don't come from NPM
  const res = await spawn('pnpm', ['view', name, '--json']);
  return JSON.parse(res.output);
}

type PackageInfo = {
  name: string;
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  versions: string[];
  time: {
    created: string;
    modified: string;
    [version: string]: string;
  };
};

type DependencyInfo = {
  name: string;
  currentVersionRange: string;
  info: PackageInfo;
};

async function fetchAllPackageInfos(
  deps: DependencyVersionMap,
): Promise<DependencyInfo[]> {
  const infos = await Promise.all(
    Object.entries(deps).map(async ([name, currentVersionRange]) => ({
      name,
      currentVersionRange,
      info: await fetchPackageInfo(name),
    })),
  );
  return infos.toSorted((a, b) => a.name.localeCompare(b.name));
}

type UpgradeDetails = {
  name: string;
  rangePrefix: string;
  currentVersion: string;
  currentVersionReleasedAt: Date;
  currentRange: string;
  upgradeToVersion: string;
  upgradeToVersionReleasedAt: Date;
  upgradeToRange: string;
  diff: semver.ReleaseType | null;
  latestVersion: string;
  latestVersionReleasedAt: Date;
};

async function detectUpgrades(
  deps: DependencyInfo[],
  isMajor: boolean,
): Promise<UpgradeDetails[]> {
  const results: UpgradeDetails[] = [];

  for (const dep of deps) {
    const currentRange = dep.currentVersionRange;
    if (currentRange === '*') continue;

    const parts = currentRange.split(' || ').map((part) => part.trim());
    const lastRange = parts[parts.length - 1];
    const isUnion = parts.length > 1;

    const rangePrefix = lastRange.match(/^(.?)(\d+\.\d+\.\d+)/)?.[1] ?? '';

    const currentVersion = semver.minVersion(lastRange)?.version;
    if (currentVersion == null)
      throw Error(`Invalid version specifier: ${dep.name}@${currentRange}`);

    const currentVersionReleasedAt = new Date(dep.info.time[currentVersion]);
    const isPre1 = currentVersion.startsWith('0.');

    const latestVersion = dep.info['dist-tags'].latest;
    const latestVersionReleasedAt = new Date(dep.info.time[latestVersion]);

    semver.RELEASE_TYPES;
    const upgradeToVersion = isMajor
      ? // Always use the latest version for major upgrades
        latestVersion
      : // Otherwise use the last stable version greater than the current version that is not a major release
        (dep.info.versions.findLast(
          (v) =>
            semver.gt(v, currentVersion) &&
            (isPre1 ? ['patch'] : ['patch', 'minor']).includes(
              semver.diff(v, currentVersion)!,
            ) &&
            semver.prerelease(v) == null,
        ) ?? currentVersion);
    const upgradeToVersionReleasedAt = new Date(
      dep.info.time[upgradeToVersion],
    );

    let upgradeToRange = `${rangePrefix}${upgradeToVersion}`;
    upgradeToRange = isUnion
      ? semver.satisfies(upgradeToVersion, currentRange)
        ? currentRange
        : `${currentRange} || ${upgradeToRange}`
      : upgradeToRange;

    let diff = semver.diff(currentVersion, upgradeToVersion);
    if (isPre1) {
      if (diff === 'minor') diff = 'major';
      if (diff === 'patch') diff = 'minor';
    }

    if (upgradeToRange === currentRange) continue;
    // if (currentVersion === latestVersion) continue;

    results.push({
      name: dep.name,
      rangePrefix,
      diff,
      currentVersion,
      currentVersionReleasedAt,
      currentRange,
      upgradeToVersion,
      upgradeToVersionReleasedAt,
      upgradeToRange,
      latestVersion,
      latestVersionReleasedAt,
    });
  }

  return results;
}

function printUpgrades(upgrades: UpgradeDetails[]): void {
  const namePadding = Math.max(...upgrades.map((u) => u.name.length));
  const currentVersionPadding = Math.max(
    ...upgrades.map((u) => u.currentRange.length),
  );
  const upgradeToVersionPadding = Math.max(
    ...upgrades.map((u) => u.upgradeToRange.length),
  );
  const numberPadding = String(upgrades.length + 1).length + 1;

  consola.info(`Found ${upgrades.length} upgrades:`);
  console.log();
  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    const num = `\x1b[2m${(i + 1).toString().padStart(numberPadding)}.\x1b[0m`;
    const name = `\x1b[35m${upgrade.name.padEnd(namePadding)}\x1b[0m`;
    const color =
      upgrade.diff == null
        ? '\x1b[2m'
        : upgrade.diff === 'patch'
          ? '\x1b[32m'
          : upgrade.diff === 'minor'
            ? '\x1b[33m'
            : '\x1b[31m';
    const currentVersion = `\x1b[2m${upgrade.currentRange.padEnd(currentVersionPadding)}\x1b[0m`;
    const upgradeToVersion = `${color}${upgrade.upgradeToRange.padEnd(upgradeToVersionPadding)}\x1b[0m`;
    const latest =
      upgrade.latestVersion !== upgrade.upgradeToVersion
        ? ` \x1b[2m\x1b[31m(${upgrade.latestVersion} available)\x1b[0m`
        : '';
    console.log(
      `  ${num} ${name}  ${currentVersion}  \x1b[2m→\x1b[0m  ${upgradeToVersion}${latest}`,
    );
  }
  console.log();
}

async function writeUpgrades(
  packageJsonFiles: string[],
  upgrades: UpgradeDetails[],
) {
  for (const packageJsonFile of packageJsonFiles) {
    const oldText = await fs.readFile(packageJsonFile, 'utf8');
    let newText = oldText;
    for (const upgrade of upgrades) {
      const search = `"${upgrade.name}": "${upgrade.currentRange}"`;
      const replace = `"${upgrade.name}": "${upgrade.upgradeToRange}"`;
      newText = newText.replaceAll(search, replace);
    }
    if (newText !== oldText) {
      await fs.writeFile(packageJsonFile, newText, 'utf8');
    }
  }
}
