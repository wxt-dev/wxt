//
// Build all workspace packages, or only dependencies of a specific package.
// Kind of a simple version of nx/turborepo, but we can keep using PNPM to run
// all commands.
//
// Usage:
//   pnpm tsx scripts/build-deps.ts               # Builds all packages in repo
//   pnpm tsx scripts/build-deps.ts <packageName> # Builds only dependencies of <packageName>
//

import glob from 'fast-glob';
import { DepGraph } from 'dependency-graph';
import fs from 'fs-extra';
import YAML from 'yaml';
import { execa } from 'execa';
import consola from 'consola';
import { hashFile, hash } from 'hasha';
import { resolve } from 'node:path';

// Quick hack to prevent recursive calls to this script. If it's being called
// from another instance of this script, the parent instance is already
// preforming this build, so it can be skipped.
if (process.env.BUILD_DEPS) process.exit(0);
process.env.BUILD_DEPS = 'true';

// Parse args
const packageToBuild = process.argv[2];
if (packageToBuild == null) {
  consola.info('Building all packages...');
} else {
  consola.info(`Building dependencies of \`${packageToBuild}\``);
}

// Build graph
const workspace: { packages: string[] } = YAML.parse(
  await fs.readFile('pnpm-workspace.yaml', 'utf8'),
);
const packageDirs = await glob(workspace.packages, { onlyDirectories: true });

const graph = new DepGraph<Record<string, any>>();
// Add all packages to chart
for (const packageDir of packageDirs) {
  try {
    const packageJson = await fs.readJson(`${packageDir}/package.json`);
    graph.addNode(packageJson.name, { ...packageJson, dir: packageDir });
  } catch {
    // Package missing package.json, ignore it
  }
}
// Add dependencies between packages
graph.entryNodes().forEach((packageName) => {
  const packageJson = graph.getNodeData(packageName);
  [
    ...Object.entries<string>(packageJson.dependencies ?? {}),
    ...Object.entries<string>(packageJson.devDependencies ?? {}),
  ].forEach(([dep, version]) => {
    if (version !== 'workspace:*') return;
    graph.addDependency(packageName, dep);
  });
});
function printGraph(graph: DepGraph<any>) {
  consola.debug('Dependency Graph:');
  function printNode(node: string, level = 0) {
    consola.debug(`${''.padStart(level * 2, ' ')}- \`${node}\``);
    graph.dependenciesOf(node).forEach((dep) => printNode(dep, level + 1));
  }
  graph.entryNodes().forEach((entry) => printNode(entry));
}
printGraph(graph);
if (packageToBuild) {
  // Remove nodes not associated with the package to build
  graph.entryNodes().forEach((entry) => {
    if (entry !== packageToBuild) graph.removeNode(entry);
  });
}

// Get order
const buildOrder = graph.overallOrder().filter(
  // Remove packageToBuild if provided
  (packageName) => packageName !== packageToBuild,
);
consola.info('Build order:', buildOrder);

// Build dependencies of a package
async function hashDir(dir: string): Promise<string> {
  const files = await glob('**/*', {
    ignore: [
      '**/dist/**',
      '**/node_modules/**',
      '**/__tests__/**',
      '**/e2e/**',
      'CHANGELOG.md',
      'typedoc.json',
      'vitest.*.ts',
    ],
    cwd: dir,
  });
  const hashes = await Promise.all(
    files.sort().map(async (file) => {
      const hash = await hashFile(resolve(dir, file), { algorithm: 'md5' });
      return `${hash}-${file}`;
    }),
  );
  consola.debug(hashes.join('\n'));
  return await hash(hashes.join('\n'), { algorithm: 'md5' });
}
async function buildPackage(packageName: string): Promise<void> {
  const packageJson = graph.getNodeData(packageName);
  const hash = await hashDir(packageJson.dir);
  consola.debug('Directory hash:', hash);
  const cacheDir = resolve('.cache', packageJson.dir, hash);
  const outputDir = resolve(packageJson.dir, 'dist');
  if (await fs.pathExists(cacheDir)) {
    await fs.ensureDir(outputDir);
    await fs.copy(cacheDir, outputDir);
    consola.success(`\`${packageName}\` cached`);
  } else {
    await execa('pnpm', ['--filter', packageName, 'build'], {
      stdio: 'inherit',
    });
    await fs.ensureDir(cacheDir);
    await fs.copy(outputDir, cacheDir);
  }
}

try {
  for (const packageName of buildOrder) {
    await buildPackage(packageName);
  }
} catch (err) {
  consola.error(err);
  process.exit(1);
}
