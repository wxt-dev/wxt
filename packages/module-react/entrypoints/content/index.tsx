import { defineContentScript } from 'wxt/sandbox';
import { ContentScriptContext, createShadowRootUi } from 'wxt/client';
import React from 'react';
import ReactDOM from 'react-dom/client';

export default defineContentScript({
  matches: ['*://*/*'],

  async main(ctx) {
    const ui = await createUi(ctx);
    ui.mount();
  },
});

function createUi(ctx: ContentScriptContext) {
  return createShadowRootUi(ctx, {
    name: 'solid-ui',
    position: 'inline',
    append: 'first',
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
      return root;
    },
    onRemove(root) {
      root?.unmount();
    },
  });
}
