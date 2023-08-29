import { registerBackgroundApi } from '@@/utils/background-api';

export default defineBackground(() => {
  // Construct, register, and return the API object
  const api = registerBackgroundApi();

  // Access todos from the background
  void api.todos.list().then((todos) => {
    console.log({ todos });
  });
});
