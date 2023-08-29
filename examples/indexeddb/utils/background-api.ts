import { defineProxyService } from '@webext-core/proxy-service';
import { openIdb } from './idb';
import { TodosRepo, createTodosRepo } from './todos-repo';

interface BackgroundApi {
  todos: TodosRepo;
}

export const [registerBackgroundApi, getBackgroundApi] = defineProxyService(
  'background-api',
  (): BackgroundApi => {
    const idb = openIdb();
    const todos = createTodosRepo(idb);

    return {
      todos,
    };
  },
);
