import { dirname, join, relative, resolve } from 'path';
import fs from 'fs-extra';
import glob from 'fast-glob';
import { execaCommand } from 'execa';
import { InlineConfig, UserConfig, build } from '../src';
import { normalizePath } from '../src/core/utils/paths';
import merge from 'lodash.merge';

export class TestProject {
  files: Array<[string, string]> = [];
  config: UserConfig | undefined;
  readonly root: string;

  constructor(packageJson: any = {}) {
    // We can't put each test's project inside e2e/dist directly, otherwise the wxt.config.ts
    // file is cached and cannot be different between each test. Instead, we add a random ID to the
    // end to make each test's path unique.
    const id = Math.random().toString(32).substring(3);
    this.root = join('e2e/dist', id);
    this.files.push([
      'package.json',
      JSON.stringify(
        merge(
          {
            name: 'E2E Extension',
            description: 'Example description',
            version: '0.0.0-test',
            dependencies: {
              wxt: '../../..',
            },
          },
          packageJson,
        ),
        null,
        2,
      ),
    ]);
  }

  /**
   * Add a `wxt.config.ts` to the project with specific contents.
   */
  setConfigFileConfig(config: UserConfig = {}) {
    this.config = config;
    this.files.push([
      'wxt.config.ts',
      `import { defineConfig } from 'wxt'\n\nexport default defineConfig(${JSON.stringify(
        config,
        null,
        2,
      )})`,
    ]);
  }

  /**
   * Adds the file to the project. Stored in memory until `.build` is called.
   *
   * @param filename Filename relative to the project's root.
   * @param content File content.
   */
  addFile(filename: string, content?: string) {
    this.files.push([filename, content ?? '']);
    if (filename === 'wxt.config.ts') this.config = {};
  }

  /**
   * Write the files to the test directory install dependencies, and build the project.
   */
  async build(config: InlineConfig = {}) {
    if (this.config == null) this.setConfigFileConfig();

    for (const file of this.files) {
      const [name, content] = file;
      const filePath = resolve(this.root, name);
      const fileDir = dirname(filePath);
      await fs.ensureDir(fileDir);
      await fs.writeFile(filePath, content ?? '', 'utf-8');
    }

    await execaCommand('npm i --ignore-scripts', { cwd: this.root });
    await build({ ...config, root: this.root });
  }

  /**
   * Read all the files from the test project's `.output` directory and combine them into a string
   * that can be used in a snapshot.
   *
   * Optionally, provide a list of filenames whose content is not printed (because it's inconsistent
   * or not relevant to a test).
   */
  serializeOutput(ignoreContentsOfFilenames?: string[]): Promise<string> {
    return this.serializeDir('.output', ignoreContentsOfFilenames);
  }

  /**
   * Read all the files from the test project's `.wxt` directory and combine them into a string
   * that can be used in a snapshot.
   */
  serializeWxtDir(): Promise<string> {
    return this.serializeDir(
      resolve(this.config?.srcDir ?? this.root, '.wxt/types'),
    );
  }

  /**
   * Deeply print the filename and contents of all files in a directory.
   *
   * Optionally, provide a list of filenames whose content is not printed (because it's inconsistent
   * or not relevant to a test).
   */
  private async serializeDir(
    dir: string,
    ignoreContentsOfFilenames?: string[],
  ): Promise<string> {
    const outputFiles = await glob('**/*', {
      cwd: resolve(this.root, dir),
      ignore: ['**/node_modules', '**/.output'],
    });
    outputFiles.sort();
    const fileContents = [];
    for (const file of outputFiles) {
      const path = resolve(this.root, dir, file);
      const isContentIgnored = !!ignoreContentsOfFilenames?.find(
        (ignoredFile) => normalizePath(path).endsWith(ignoredFile),
      );
      fileContents.push(await this.serializeFile(path, isContentIgnored));
    }
    return fileContents.join(`\n${''.padEnd(80, '=')}\n`);
  }

  /**
   * @param path An abosolute path to a file or a path relative to the root.
   * @param ignoreContents An optional boolean that, when true, causes this function to not print
   *                       the file contents.
   */
  async serializeFile(path: string, ignoreContents?: boolean): Promise<string> {
    const absolutePath = resolve(this.root, path);
    return [
      normalizePath(relative(this.root, absolutePath)),
      ignoreContents ? '<contents-ignored>' : await fs.readFile(absolutePath),
    ].join(`\n${''.padEnd(40, '-')}\n`);
  }

  fileExists(path: string): Promise<boolean> {
    return fs.exists(resolve(this.root, path));
  }

  async getOutputManifest(
    path: string = '.output/chrome-mv3/manifest.json',
  ): Promise<any> {
    return await fs.readJson(resolve(this.root, path));
  }
}
