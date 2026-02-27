import { BuildOutput } from '../../types';
import path from 'node:path';
import fs from 'fs-extra';
import { wxt } from '../wxt';

/**
 * Analyzes the build output to find all external files (files outside the project directory)
 * that are imported by the extension and should be included in the sources zip.
 */
export async function gatherExternalFiles(
  output: BuildOutput,
): Promise<string[]> {
  const externalFiles = new Set<string>();
  const sourcesRoot = path.resolve(wxt.config.zip.sourcesRoot);

  // Iterate through all build steps and chunks to find external module dependencies
  for (const step of output.steps) {
    for (const chunk of step.chunks) {
      if (chunk.type === 'chunk') {
        // Check each module ID (dependency) in the chunk
        for (const moduleId of chunk.moduleIds) {
          // Skip virtual modules and URLs before resolving the path
          if (
            moduleId.startsWith('virtual:') ||
            moduleId.startsWith('http') ||
            moduleId.includes('node_modules') ||
            !path.isAbsolute(moduleId)
          ) {
            continue;
          }

          const normalizedModuleId = path.resolve(moduleId);

          // Only include files that are outside the sources root directory
          if (!normalizedModuleId.startsWith(sourcesRoot)) {
            try {
              await fs.access(normalizedModuleId);
              externalFiles.add(normalizedModuleId);
            } catch (error) {}
          } else {
          }
        }
      }
    }
  }

  const externalFilesArray = Array.from(externalFiles);

  if (externalFilesArray.length > 0) {
    wxt.logger.info(
      `Found ${externalFilesArray.length} external source files to include in zip`,
    );
    externalFilesArray.forEach((file) => {
      wxt.logger.debug(
        `  External file: ${path.relative(process.cwd(), file)}`,
      );
    });
  }

  return externalFilesArray;
}
