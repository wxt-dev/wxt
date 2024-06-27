import { Component } from 'solid-js';

export const App: Component = () => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount((count) => count + 1);
  return <button onClick={increment}>Count: {count()}</button>;
};
