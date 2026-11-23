import { spawn } from 'node:child_process';

/**
 * Streams the child's own stdio straight through — runs during `wxt build -b
 * safari`.
 */
export function run(
  cmd: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd: options.cwd });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

/**
 * Captures stdout instead of streaming it — for tools whose output we parse
 * rather than show.
 */
export function capture(
  cmd: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: options.cwd,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else
        reject(
          new Error(
            `${cmd} exited with code ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`,
          ),
        );
    });
  });
}
