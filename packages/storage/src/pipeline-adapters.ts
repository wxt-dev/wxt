import { assertMutable, type WxtStorageDriver } from './driver';
import {
  runReadPipeline,
  runWritePipeline,
  type ReadPipelineAdapter,
  type WritePipelineAdapter,
} from './pipeline';
import type { WxtStorageItemOptions } from './types';

export const cloneFallback = <T>(fallback: T | null | undefined): T | null =>
  fallback == null ? null : (structuredClone(fallback) as T);

export const processReadValue = async <T>(
  raw: unknown,
  opts: WxtStorageItemOptions<T> | undefined,
  driver: WxtStorageDriver,
  driverKey: string,
  pipelineOpts: { allowReset?: boolean } = {},
): Promise<T | null> => {
  const rawFallback = (opts?.fallback ?? opts?.defaultValue) as
    | T
    | null
    | undefined;
  const getFallback = (): T | null => cloneFallback<T>(rawFallback);

  if (raw == null) return getFallback();

  const schema = opts?.schema;
  const read = opts?.serializer?.read;

  // No schema: return the deserialized wire value, or trust the caller's T.
  if (!schema) return read ? read(raw) : (raw as T);

  const adapter: ReadPipelineAdapter<T | null> = {
    preValidate: (r) => (read ? read(r) : r),
    validate: async (pre) => schema['~standard'].validate(pre),
    fallback: getFallback,
    onValidationError: opts.onValidationError ?? 'throw',
    resetUnderLock:
      pipelineOpts.allowReset !== false
        ? async () => {
            assertMutable(driver);
            await driver.removeItem(driverKey);
          }
        : undefined,
  };

  return runReadPipeline(raw, adapter);
};

export const processWriteValue = async <T>(
  value: T,
  opts: WxtStorageItemOptions<T> | undefined,
): Promise<{ raw: unknown; validated: T }> => {
  const schema = opts?.schema;
  const write = opts?.serializer?.write;
  const adapter: WritePipelineAdapter<T> = {
    validate: schema ? async (v) => schema['~standard'].validate(v) : undefined,
    serialize: write ? (validated) => write(validated) : undefined,
  };
  return runWritePipeline(value, adapter);
};
