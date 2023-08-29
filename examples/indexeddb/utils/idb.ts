import { IDBPDatabase, DBSchema, openDB } from 'idb';

export interface Todo {
  id?: number;
  createdAt: number;
  title: string;
  done: boolean;
}

export interface ExtensionDbSchema extends DBSchema {
  todos: {
    value: Todo;
    key: number;
  };
}

export type ExtensionDb = IDBPDatabase<ExtensionDbSchema>;

export function openIdb(): Promise<ExtensionDb> {
  const db = openDB<ExtensionDbSchema>('extension-database', 1, {
    upgrade(db) {
      db.createObjectStore('todos', {
        autoIncrement: true,
        keyPath: 'id',
      });
    },
  });
  return db;
}
