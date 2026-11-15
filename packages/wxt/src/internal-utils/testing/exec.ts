/** SHOULD ONLY BE IMPORTED IN TESTS. */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run a command and wait for it to finish. Rejects if the command can't be
 * started or exits with a non-zero code.
 */
export function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // npm, pnpm, etc. are `.cmd` shims on Windows and can't be spawned directly
      shell: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const result = { stdout, stderr, exitCode: code ?? 1 };
      if (result.exitCode === 0) return resolve(result);
      reject(
        Object.assign(
          new Error(
            `Command failed (exit code ${result.exitCode}): ${[command, ...args].join(' ')}\n${stdout}${stderr}`,
          ),
          { exitCode: result.exitCode, output: { stdout, stderr } },
        ),
      );
    });
  });
}

/** Extract a ZIP file into `outDir`. */
export async function unzip(zipPath: string, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  // `tar` ships with Windows and can read ZIPs, `unzip` is on Linux and macOS
  if (process.platform === 'win32')
    await exec('tar', ['-xf', zipPath, '-C', outDir]);
  else await exec('unzip', ['-q', '-o', zipPath, '-d', outDir]);
}
