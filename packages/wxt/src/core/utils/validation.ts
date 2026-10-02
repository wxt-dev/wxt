import {
  ContentScriptEntrypoint,
  Entrypoint,
  ResolvedConfig,
} from '../../types';
import { isSpaContentScript } from './content-scripts';

export function validateEntrypoints(
  entrypoints: Entrypoint[],
  config: Pick<ResolvedConfig, 'experimental'>,
): ValidationResults {
  const errors = entrypoints.flatMap((entrypoint) => {
    switch (entrypoint.type) {
      case 'content-script':
        return validateContentScriptEntrypoint(entrypoint, config);
      default:
        return validateBaseEntrypoint(entrypoint);
    }
  });

  let errorCount = 0;
  let warningCount = 0;
  for (const err of errors) {
    if (err.type === 'warning') warningCount++;
    else errorCount++;
  }

  return {
    errors,
    errorCount,
    warningCount,
  };
}

function validateContentScriptEntrypoint(
  definition: ContentScriptEntrypoint,
  config: Pick<ResolvedConfig, 'experimental'>,
): ValidationResult[] {
  const errors = validateBaseEntrypoint(definition);
  const options = definition.options;
  if (options.registration !== 'runtime' && options.matches == null) {
    errors.push({
      type: 'error',
      message: '`matches` is required for manifest registered content scripts',
      value: options.matches,
      entrypoint: definition,
    });
  }

  if (isSpaContentScript(options)) {
    if (!config.experimental.spaContentScripts) {
      errors.push({
        type: 'error',
        message:
          '`spa` is experimental. Set `experimental: { spaContentScripts: true }` in your `wxt.config.ts` to use it',
        value: options.spa,
        entrypoint: definition,
      });
    }
    if (options.world === 'MAIN') {
      errors.push({
        type: 'error',
        message:
          '`spa` is not supported for `world: "MAIN"` content scripts - they do not receive a `ContentScriptContext`',
        value: options.world,
        entrypoint: definition,
      });
    }
    if (options.matches == null) {
      errors.push({
        type: 'error',
        message:
          '`matches` is required for `spa` content scripts - it is what the SPA handler matches URLs against at runtime',
        value: options.matches,
        entrypoint: definition,
      });
    }
    // Same problem as `excludeMatches`, but WXT has no runtime glob matcher to
    // move them to.
    for (const key of ['includeGlobs', 'excludeGlobs'] as const) {
      if (options[key] != null) {
        errors.push({
          type: 'error',
          message: `\`${key}\` is not supported alongside \`spa\`. Use \`matches\`/\`excludeMatches\`, which the SPA handler re-evaluates on every navigation`,
          value: options[key],
          entrypoint: definition,
        });
      }
    }
  }

  return errors;
}

function validateBaseEntrypoint(definition: Entrypoint): ValidationResult[] {
  const errors: ValidationResult[] = [];

  if (
    definition.options.exclude != null &&
    !Array.isArray(definition.options.exclude)
  ) {
    errors.push({
      type: 'error',
      message: '`exclude` must be an array of browser names',
      value: definition.options.exclude,
      entrypoint: definition,
    });
  }
  if (
    definition.options.include != null &&
    !Array.isArray(definition.options.include)
  ) {
    errors.push({
      type: 'error',
      message: '`include` must be an array of browser names',
      value: definition.options.include,
      entrypoint: definition,
    });
  }

  return errors;
}

export interface ValidationResult {
  type: 'warning' | 'error';
  message: string;
  entrypoint: Entrypoint;
  value: any;
}

export interface ValidationResults {
  errors: ValidationResult[];
  errorCount: number;
  warningCount: number;
}

export class ValidationError extends Error {}
