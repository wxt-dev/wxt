import { ContentScriptEntrypoint, Entrypoint } from '~/types';

export function validateEntrypoints(
  entrypoints: Entrypoint[],
): ValidationResults {
  const errors = entrypoints.flatMap((entrypoint) => {
    switch (entrypoint.type) {
      case 'content-script':
        return validateContentScriptEntrypoint(entrypoint);
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
): ValidationResult[] {
  const errors = validateBaseEntrypoint(definition);
  if (definition.options.matches == null) {
    errors.push({
      type: 'error',
      message: '`matches` is required',
      value: definition.options.matches,
      entrypoint: definition,
    });
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
