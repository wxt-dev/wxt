import type { StorageArea, Unwatch, WatchCallback } from './types';

export interface BaseStorageDriver<TArea extends StorageArea> {
  readonly area: TArea;
  getItem(key: string): Promise<unknown>;
  getItems(
    keys: readonly string[],
  ): Promise<Array<{ key: string; value: unknown }>>;
  snapshot(): Promise<Record<string, unknown>>;
  watch(key: string, cb: WatchCallback<unknown>): Unwatch;
  unwatch(): void;
}

export interface MutableStorageDriver<
  TArea extends StorageArea,
> extends BaseStorageDriver<TArea> {
  setItem(key: string, value: unknown): Promise<void>;
  setItems(
    values: ReadonlyArray<{ key: string; value: unknown }>,
  ): Promise<void>;
  removeItem(key: string): Promise<void>;
  removeItems(keys: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  restoreSnapshot(data: Record<string, unknown>): Promise<void>;
}

export type ReadonlyStorageDriver<TArea extends StorageArea> =
  BaseStorageDriver<TArea>;

export type WxtStorageDriver<TArea extends StorageArea = StorageArea> =
  TArea extends 'managed'
    ? ReadonlyStorageDriver<TArea>
    : MutableStorageDriver<TArea>;

export function assertMutable(
  driver: WxtStorageDriver,
): asserts driver is MutableStorageDriver<Exclude<StorageArea, 'managed'>> {
  if (driver.area === 'managed') {
    throw Error(
      `Cannot write to \`browser.storage.managed\` — it is read-only. ` +
        `Managed policy is set by admins and cannot be modified from an extension.`,
    );
  }
}
