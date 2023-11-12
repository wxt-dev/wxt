import { loadConfig } from 'c12';
import { PackageInfo, getPackageManager } from './package-manager';
import { InternalConfig } from '~/types';
import fs from 'fs-extra';
import stream from 'node:stream';
import { promisify } from 'node:util';

export async function getPrivatePackages(
  config: InternalConfig,
): Promise<PrivatePackageInfo[]> {
  const pm = await getPackageManager(config);

  const [deps, npmrc] = await Promise.all([
    pm.getAllDependencies(),
    loadNpmrcConfig(),
  ]);
  const privateScopes = getScopesWithTokens(npmrc);

  return deps
    .map((dep) => {
      const scope = dep.name.includes('/') ? dep.name.split('/')[0] : undefined;
      const token = scope ? privateScopes[scope] : undefined;
      return { ...dep, token };
    })
    .filter((dep) => !!dep.token && !!dep.url) as PrivatePackageInfo[];
}

export async function downloadPrivatePackage(
  pkg: PrivatePackageInfo,
  outputPath: string,
): Promise<void> {
  const response = await fetch(pkg.url, {
    headers: { Authorization: `token ${pkg.token}` },
  });
  if (response.body == null) throw Error('Response was empty');

  // @ts-expect-error Stream type mismatch, but it's OK
  const writer = stream.Readable.fromWeb(response.body).pipe(
    fs.createWriteStream(outputPath),
  );
  return await promisify(stream.finished)(writer);
}

interface PrivatePackageInfo extends PackageInfo {
  url: string;
  token: string;
}

async function loadNpmrcConfig(): Promise<Record<string, any>> {
  const { flatten } = await import('flat');
  const { config } = await loadConfig({
    name: 'npm',
    globalRc: true,
    packageJson: false,
    dotenv: false,
  });
  return flatten(config);
}

function getScopesWithTokens(npmrc: Record<string, string>) {
  return Object.entries(npmrc).reduce(
    (map, [key, value]) => {
      // key='@scope:registry'|'//npm.pkg.github.com/:_authToken.token'
      if (!key.startsWith('@')) return map;

      const scope = /^(@.+):registry$/.exec(key)?.[1]; // key='@scope:registry'
      if (!scope) return map;

      // value='https://npm.pkg.github.com'
      const tokenKey = `//${new URL(value).host}/:_authToken`;
      const token = npmrc[tokenKey];
      if (!token) return map;

      map[scope] = token;
      return map;
    },
    {} as Record<string, string>,
  );
}
