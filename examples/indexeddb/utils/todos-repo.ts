import { ExtensionDb, Todo } from './idb';

export type CreateTodo = Omit<Todo, 'id'>;

export interface TodosRepo {
  getOne(id: number): Promise<Todo>;
  list(): Promise<Todo[]>;
  insert(todo: CreateTodo): Promise<Todo>;
  update(todo: Todo): Promise<void>;
  delete(todo: Todo | Required<Todo>['id']): Promise<void>;
}

export function createTodosRepo(database: Promise<ExtensionDb>): TodosRepo {
  return {
    async getOne(id) {
      const db = await database;
      const res = await db.get('todos', id);
      if (res == null) throw Error('Cannot get todo with id=' + id);
      return res;
    },
    async list() {
      const db = await database;
      return await db.getAll('todos');
    },
    async insert(todo) {
      const db = await database;
      const id = await db.add('todos', todo);
      return {
        ...todo,
        id,
      };
    },
    async update(todo) {
      const db = await database;
      await db.put('todos', todo);
    },
    async delete(todo) {
      const db = await database;
      const id = typeof todo === 'number' ? todo : todo.id!;
      await db.delete('todos', id);
    },
  };
}
