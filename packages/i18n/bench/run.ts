import { join, relative } from 'node:path';

const distDir = join(import.meta.dir, 'dist');
const backgroundSrc = join(import.meta.dir, 'background.ts');

console.log('\nBuilding benchmark extension...');
await Bun.build({
  entrypoints: [backgroundSrc],
  outdir: distDir,
  format: 'esm',
});
console.log('Done!');

console.log(
  `\nInstall the extension from ./${relative(process.cwd(), import.meta.dir)} (or reload it) to run benchmarks.`,
);
console.log('Waiting for benchmark results...');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
};

Bun.serve({
  fetch: async (request) => {
    // CORS support
    if (request.method === 'OPTIONS') {
      return new Response(undefined, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === '/progress') {
      console.log(`\x1b[2m← ${await request.text()}\x1b[0m`);
      return new Response(undefined, { status: 202, headers: CORS_HEADERS });
    }

    if (url.pathname === '/results') {
      const body = await request.json();
      for (const [name, table] of Object.entries(body)) {
        console.log('\n' + name);
        console.table(table);
      }
      setTimeout(() => void process.exit(0));
      return new Response(undefined, { status: 202, headers: CORS_HEADERS });
    }

    return new Response(undefined, { status: 404, headers: CORS_HEADERS });
  },
});
