import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { defineWxtModule } from '../modules';
import { Wxt } from '../types';

const execFileAsync = promisify(execFile);

/**
 * Fills in `webExt.adbDevice` when a single device is connected and reverses
 * the dev server port to it so the extension's `localhost:<port>` URLs (HMR,
 * dev-mode pages) work there.
 */
export default defineWxtModule({
  name: 'wxt:built-in:adb',
  setup(wxt) {
    let removeAdbReverse: (() => Promise<void>) | undefined;
    let detectedDevice: string | undefined;

    wxt.hooks.hook('config:resolved', async (wxt) => {
      const config = wxt.config.webExt.config;
      if (config?.target !== 'firefox-android' || config.adbDevice) return;
      detectedDevice ??= await findSingleAdbDevice(wxt, config.adbBin ?? 'adb');
      config.adbDevice = detectedDevice;
    });
    wxt.hooks.hook('server:started', async (wxt, server) => {
      if (wxt.config.webExt.config?.target !== 'firefox-android') return;
      removeAdbReverse = await setupAdbReverse(wxt, server.port);
    });
    wxt.hooks.hook('server:closed', async () => {
      await removeAdbReverse?.();
      removeAdbReverse = undefined;
    });
  },
});

/**
 * When `adbDevice` isn't configured and exactly one device is connected, use
 * it. Otherwise return undefined and let web-ext report the device list.
 */
async function findSingleAdbDevice(
  wxt: Wxt,
  adbBin: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(adbBin, ['devices']);
    const devices = stdout
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length === 2 && parts[1] === 'device')
      .map((parts) => parts[0]);
    if (devices.length === 1) {
      wxt.logger.info(`Using ADB device: ${devices[0]}`);
      return devices[0];
    }
    wxt.logger.warn(
      `Expected exactly 1 connected ADB device, found ${devices.length}. Set \`webExt.adbDevice\` to pick one.`,
    );
  } catch (err) {
    wxt.logger.warn(
      `Failed to list ADB devices with "${adbBin} devices", set \`webExt.adbDevice\` manually`,
      err,
    );
  }
  return undefined;
}

async function setupAdbReverse(
  wxt: Wxt,
  port: number,
): Promise<(() => Promise<void>) | undefined> {
  const { adbBin = 'adb', adbDevice } = wxt.config.webExt.config ?? {};
  // Without `-s`, adb targets the only connected device
  const deviceArgs = adbDevice ? ['-s', adbDevice] : [];
  const portSpec = `tcp:${port}`;
  try {
    await execFileAsync(adbBin, [...deviceArgs, 'reverse', portSpec, portSpec]);
    wxt.logger.info(`Reversed dev server port ${port} to device for HMR`);
    // Ctrl+C doesn't go through server.stop(), clean up on process death too
    const removeSync = () => {
      try {
        execFileSync(adbBin, [...deviceArgs, 'reverse', '--remove', portSpec], {
          stdio: 'ignore',
        });
      } catch {}
    };
    const onSignal = (signal: NodeJS.Signals) => {
      removeSync();
      try {
        process.kill(process.pid, signal);
      } catch {
        process.exit(130);
      }
    };
    process.once('exit', removeSync);
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
    return async () => {
      process.removeListener('exit', removeSync);
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
      removeSync();
    };
  } catch (err) {
    wxt.logger.warn(
      `Failed to run "adb reverse" for port ${port}, hot reload will not work on the device`,
      err,
    );
  }
}
