import { createSignal, type Component } from 'solid-js';

import solidLogo from '../../assets/solid.svg';
import './App.css';

const App: Component = () => {
  const [count, setCount] = createSignal(0);

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src="/wxt.svg" class="logo" alt="WXT logo" />
        </a>
        <a href="https://www.solidjs.com/" target="_blank">
          <img src={solidLogo} class="logo solid" alt="SolidJS logo" />
        </a>
      </div>
      <h1>WXT + SolidJS</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count()}
        </button>
        <p>
          Edit <code>popup/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the WXT and SolidJS logos to learn more
      </p>
    </>
  );
};

export default App;
