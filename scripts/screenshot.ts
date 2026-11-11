/**
 * Take a screenshot of a page using the system Chromium.
 *
 * Usage: bun scripts/screenshot.ts [url] [output] [--width=1280] [--height=800]
 * [--full] [--dark] [--wait=ms]
 *
 * Example: bun scripts/screenshot.ts http://localhost:5173/ /tmp/home.png
 * --full
 *
 * Set CHROME_PATH to override the browser executable.
 */
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flag = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const url = positional[0] ?? 'http://localhost:5173/';
const output = positional[1] ?? '/tmp/screenshot.png';
const width = Number(flag('width') ?? 1280);
const height = Number(flag('height') ?? 800);
const fullPage = args.includes('--full');
const dark = args.includes('--dark');
const waitMs = Number(flag('wait') ?? 0);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
  ]);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30e3 });
  if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
  await page.screenshot({ path: output as `${string}.png`, fullPage });
  console.log(`Saved ${url} -> ${output}`);
} finally {
  await browser.close();
}
