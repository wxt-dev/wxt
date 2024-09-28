# Project Structure

WXT follows a strict project structure. By default, it's a flat folder structure that looks like this:

<!-- prettier-ignore -->
```html
📂 {rootDir}/ 📁 .output/ 📁 .wxt/ 📁 assets/ 📁 components/ 📁 composables/ 📁
entrypoints/ 📁 hooks/ 📁 modules/ 📁 public/ 📁 utils/ 📄 .env 📄 .env.publish
📄 app.config.ts 📄 package.json 📄 tsconfig.json 📄 web-ext.config.ts 📄
wxt.config.ts
```

Here's a brief summary of each of these files and directories:

- `.output/`: All build artifacts will go here
- `.wxt/`: Generated by WXT, it contains TS config
- `assets/`: Contains all CSS, images, and other assets that should be processed by WXT
- `components/`: Auto-imported by default, contains UI components
- `composables/`: Auto-imported by default, contains composable functions for Vue
- `entrypoints/`: Contains all the entrypoints that get bundled into your extension
- `hooks/`: Auto-imported by default, contains hooks for React and Solid
- `public/`: Contains any files you want to copy into the output folder as-is, without being processed by WXT
- `utils/`: Auto-imported by default, contains generic utilities used throughout your project
- `.env`: Contains [Environment Variables](/guide/config/runtime#environment-variables)
- `.env.publish`: Contains Environment Variables for [publishing](/guide/production/publishing)
- `app.config.ts`: Contains [Runtime Config](/guide/config/runtime)
- `package.json`: The standard file used by your package manager
- `tsconfig.json`: Config telling TypeScript how to behave
- `web-ext.config.ts`: Configure [Browser Startup](/guide/config/browser-startup)
- `wxt.config.ts`: The [main config file](/guide/config/wxt) for WXT projects

## Adding a `src/` Directory

Many developers like having a `src/` directory to separate source code from configuration files. You can enable it inside the `wxt.config.ts` file:

```ts
export default defineConfig({
  srcDir: 'src',
});
```

After enabling it, your project structure should look like this:

<!-- prettier-ignore -->
```html
📂 {rootDir}/ 📁 .output/ 📁 .wxt/ 📂 src/ 📁 assets/ 📁 components/ 📁
composables/ 📁 entrypoints/ 📁 hooks/ 📁 modules/ 📁 public/ 📁 utils/ 📄
app.config.ts 📄 .env 📄 .env.publish 📄 package.json 📄 tsconfig.json 📄
web-ext.config.ts 📄 wxt.config.ts
```

You can configure some other project folders as well. See the [wxt.config.ts file](/guide/config/wxt#directories) docs for more details.