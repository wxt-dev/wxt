import spawn from 'nano-spawn';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';
import { sep as posixSep } from 'node:path/posix';

// Fetch latest version

console.log('Getting latest version of \x1b[36m@types/chrome\x1b[0m');
await spawn('pnpm', ['i', '--ignore-scripts', '-D', '@types/chrome']);

// Generate new package.json

console.log('Generating new \x1b[36mpackage.json\x1b[0m');

const pkgJsonPath = fileURLToPath(
  import.meta.resolve('@types/chrome/package.json'),
);
const pkgDir = dirname(pkgJsonPath);
const pkgJson = await fs.readJson(pkgJsonPath);
const pkgJsonTemplate = await fs.readFile('templates/package.json', 'utf8');
const newPkgJson = JSON.parse(
  pkgJsonTemplate.replaceAll('{{chromeTypesVersion}}', pkgJson.version),
);
newPkgJson.dependencies = pkgJson.dependencies;
newPkgJson.peerDependencies = pkgJson.peerDependencies;
newPkgJson.peerDependenciesMeta = pkgJson.peerDependenciesMeta;

await fs.writeJson('package.json', newPkgJson);

// Generate declaration files

console.log('Generating declaration files');
const outDir = resolve('src/gen');
const declarationFileMapping = (
  await fs.readdir(pkgDir, {
    recursive: true,
    encoding: 'utf8',
  })
)
  // Filter to .d.ts files
  .filter((file) => file.endsWith('.d.ts'))
  // Map to usable paths
  .map((file) => ({
    file: file.replaceAll(sep, posixSep),
    srcPath: join(pkgDir, file),
    destPath: join(outDir, file),
  }));

for (const { file, srcPath, destPath } of declarationFileMapping) {
  const content = await fs.readFile(srcPath, 'utf8');
  const transformedContent = transformFile(file, content);
  const destDir = dirname(destPath);
  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(destPath, transformedContent);
  console.log(`  \x1b[2m-\x1b[0m \x1b[36m${file}\x1b[0m`);
}

// Format files

await spawn('pnpm', ['-w', 'prettier', '--write', '.']);

// Done!

console.log(
  '\x1b[32m✔\x1b[0m Done in ' + performance.now().toFixed(0) + ' ms',
);

// Transformations

function transformFile(file: string, content: string): string {
  return (
    // Add prefix
    `/* DO NOT EDIT - generated by scripts/generate.ts */\n\n${content}\n`
      // Remove global type declaration
      .replaceAll('chrome: typeof chrome;', '// chrome: typeof chrome;')
      // Rename `chrome` namespace to `Browser` and export it
      .replaceAll('declare namespace chrome', 'export namespace Browser')
      // Update references to `chrome` namespace to `Browser`
      .replaceAll('chrome.', 'Browser.')
  );
}
