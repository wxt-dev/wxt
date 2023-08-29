import { getBackgroundApi } from '@@/utils/background-api';
import { Todo } from '@@/utils/idb';
import { CreateTodo } from '@@/utils/todos-repo';

const list = document.querySelector<HTMLUListElement>('#todoList')!;
const createNewForm =
  document.querySelector<HTMLInputElement>('#createNewForm')!;
const createNewInput =
  document.querySelector<HTMLInputElement>('#createNewInput')!;

function renderTodoList(todos: Todo[]): void {
  const items = todos.map(renderTodoListItem);
  while (list.firstChild != null) list.removeChild(list.firstChild);

  if (items.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'No todos';
    emptyMessage.style.opacity = '50%';
    list.append(emptyMessage);
  } else {
    items.forEach((item) => list.append(item));
  }
}

function renderTodoListItem(todo: Todo): HTMLLIElement {
  const listItem = document.createElement('li');
  listItem.style.display = 'flex';
  listItem.style.alignItems = 'center';
  listItem.style.gap = '8px';
  listItem.style.flexWrap = 'nowrap';
  listItem.style.cursor = 'pointer';
  listItem.addEventListener('click', async () => {
    checkbox.disabled = true;
    await api.todos.update({ ...todo, done: !todo.done });
    await loadTodos();
  });

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.done;
  listItem.append(checkbox);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = todo.title;
  titleSpan.style.flex = '1';
  if (todo.done) titleSpan.style.textDecoration = 'line-through';
  listItem.append(titleSpan);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'x';
  listItem.append(deleteButton);
  deleteButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    await api.todos.delete(todo);
    await loadTodos();
  });

  return listItem;
}

async function loadTodos() {
  const todos = await api.todos.list();
  renderTodoList(todos);
}

const api = getBackgroundApi();

loadTodos();

createNewForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const todo: CreateTodo = {
    createdAt: Date.now(),
    done: false,
    title: createNewInput.value,
  };
  await api.todos.insert(todo);
  createNewInput.value = '';
  await loadTodos();
});
