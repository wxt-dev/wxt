---
name: docs-screenshots
description: Take screenshots of the WXT docs site (VitePress) in light or dark mode to visually verify theme, style, or layout changes. Use after editing anything in docs/.vitepress or when the user asks to see how a docs page looks.
---

# Taking screenshots of the docs site

Use this to visually check docs changes. The workflow is: start the dev server, screenshot pages with `scripts/screenshot.ts`, view the images, stop the server.

## Setup (already done in this repo)

- `puppeteer-core` is a root devDependency. It drives the system Chromium at `/usr/bin/chromium` (override with `CHROME_PATH`).
- `scripts/screenshot.ts` takes the screenshot.
- `.screenshots/` is gitignored. Save images there, because the `read_file` tool can only view images inside the project (not `/tmp`).

## Steps

1. Start the dev server as a background process on a port other than 5173 (the user often has their own server running there). Run from the repo root:

   ```sh
   (bun run --bun vitepress dev docs --port 5199 > /tmp/dev.log 2>&1 &)
   ```

   Use `vitepress dev` directly, not `bun docs:dev`, to skip typedoc generation.

   Don't use `sleep` to wait for it. Wait until the server responds instead, which returns as soon as it's ready and fails after ~30s if it never starts (check `/tmp/dev.log`):

   ```sh
   curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 http://localhost:5199/
   ```

2. Take screenshots. Run one command per page, with literal URLs and paths (the terminal tool rejects `$VAR` and loops with substitutions):

   ```sh
   bun scripts/screenshot.ts http://localhost:5199/ .screenshots/home.png --dark
   bun scripts/screenshot.ts http://localhost:5199/guide/introduction.html .screenshots/intro.png --dark
   ```

   Options: `--dark` (default is light), `--full` (full-page), `--width=1280`, `--height=800`.

   Usual set of pages to check:

   | Name                           | URL path                                     |
   | ------------------------------ | -------------------------------------------- |
   | home                           | `/`                                          |
   | intro                          | `/guide/introduction.html`                   |
   | examples                       | `/examples.html`                             |
   | storage (standalone docs page) | `/storage.html`                              |
   | structure                      | `/guide/essentials/project-structure.html`   |
   | blog (list)                    | `/blog.html`                                 |
   | blog-post                      | `/blog/2024-12-06-using-imports-module.html` |

3. View each image with `read_file` on `.screenshots/<name>.png`.

4. Stop the server once you're done. Always do this, even if a screenshot failed:

   ```sh
   pkill -f "vitepress dev docs --port 5199"
   ```

## Everything in one command

Start, wait, screenshot, and kill in a single call. Joining with `;` (not `&&`) makes sure `pkill` runs even if a screenshot fails:

```sh
(bun run --bun vitepress dev docs --port 5199 > /tmp/dev.log 2>&1 &) ; curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 http://localhost:5199/ ; bun scripts/screenshot.ts http://localhost:5199/ .screenshots/home.png --dark ; bun scripts/screenshot.ts http://localhost:5199/examples.html .screenshots/examples.png --dark ; pkill -f "vitepress dev docs --port 5199"
```

Set a `timeout_ms` (e.g. 120000) on the terminal call so a hang can't block forever.

If you take screenshots across several tool calls, leave the server running between them and run the `pkill` command at the end. Kill by command pattern rather than by PID, since the terminal tool doesn't allow `$!`.

## Screenshotting a section below the fold

For anchors like the home page's `#who-s-using-wxt`, load the page, scroll the element into view, wait for async content (it fetches data), then screenshot. Write a small throwaway puppeteer script in `.screenshots/` (import `puppeteer-core`, launch with `executablePath: '/usr/bin/chromium'` and `args: ['--no-sandbox']`, call `page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])`, `page.evaluate(() => document.querySelector('#id')?.scrollIntoView())`, wait ~1.5s, then `page.screenshot`). Delete it afterwards.

## Notes

- Check both light and dark when a change touches shared colors. Dark theme variables live in the `.dark` block of `docs/.vitepress/theme/custom.css`; shared surface colors are `--wxt-c-bg-panel` and `--wxt-c-card-border`.
- Dark text should meet WCAG AA (4.5:1 for normal text).
- Leave the final screenshots in `.screenshots/` when the user wants to review them; otherwise clean them up.
- Never commit screenshots.
