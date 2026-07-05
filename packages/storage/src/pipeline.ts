import type { StandardSchemaV1 } from '@standard-schema/spec';
import { SchemaError } from '@standard-schema/utils';
import type { OnValidationError } from './types';

export type PipelineValidateResult<TOut> = StandardSchemaV1.Result<TOut>;

/**
 * Wrap a synchronous or asynchronous parse function into a Standard Schema. Use
 * for validators that don't conform natively (TypeBox `Value.Parse`, io-ts
 * `.decode`, hand-rolled parsers). `parse` must return the value or throw.
 */
export function defineSchema<T>(
  parse: (value: unknown) => T | Promise<T>,
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: '@wxt-dev/storage/defineSchema',
      validate: async (value: unknown): Promise<StandardSchemaV1.Result<T>> => {
        try {
          return { value: await parse(value) };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return { issues: [{ message }] };
        }
      },
    },
  };
}

export interface ReadPipelineAdapter<TOut> {
  readonly preValidate: (raw: unknown) => unknown;
  readonly validate: (pre: unknown) => Promise<PipelineValidateResult<TOut>>;
  readonly fallback: () => TOut;
  readonly onValidationError: OnValidationError<TOut>;
  readonly resetUnderLock?: (() => Promise<void>) | undefined;
}

export async function runReadPipeline<TOut>(
  raw: unknown,
  adapter: ReadPipelineAdapter<TOut>,
): Promise<TOut> {
  const pre = adapter.preValidate(raw);
  const result = await adapter.validate(pre);

  if (result.issues) {
    const strategy = adapter.onValidationError;
    if (strategy === 'throw') throw new SchemaError(result.issues);
    if (strategy === 'fallback') return adapter.fallback();
    if (strategy === 'reset') {
      if (adapter.resetUnderLock) await adapter.resetUnderLock();
      return adapter.fallback();
    }
    return strategy(result.issues, raw);
  }
  return result.value;
}

export interface WritePipelineAdapter<TIn> {
  readonly validate?:
    | ((value: TIn) => Promise<PipelineValidateResult<TIn>>)
    | undefined;
  readonly serialize?: ((validated: TIn) => unknown) | undefined;
}

export interface WritePipelineResult<TIn> {
  readonly raw: unknown;
  readonly validated: TIn;
}

export async function runWritePipeline<TIn>(
  value: TIn,
  adapter: WritePipelineAdapter<TIn>,
): Promise<WritePipelineResult<TIn>> {
  let validated: TIn = value;
  if (adapter.validate) {
    const result = await adapter.validate(value);
    if (result.issues) throw new SchemaError(result.issues);
    validated = result.value;
  }
  const raw: unknown = adapter.serialize
    ? adapter.serialize(validated)
    : validated;
  return { raw, validated };
}
