#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

if (process.env.NETLIFY === 'true') {
  console.log('Skipping vp postinstall on Netlify');
  process.exit(0);
}

const result = spawnSync(
  'vp',
  ['run', '--filter', './packages/*', 'postinstall'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
process.exit(result.status ?? 1);
