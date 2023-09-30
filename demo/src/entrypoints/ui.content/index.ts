import '../../common/style.css';
import './style.css';

export default defineContentScript({
  matches: ['https://*.duckduckgo.com/*'],
  cssInjectionMode: 'manual',

  async main(ctx) {
    const ui = await createContentScriptUi(ctx, {
      name: 'demo-ui',
      type: 'inline',
      append: 'before',
      anchor: 'form[role=search]',
      mount: (uiContainer) => {
        const app = document.createElement('div');
        app.textContent = 'Custom content script UI';
        uiContainer.append(app);
      },
    });
    ui.mount();

    setTimeout(ui.remove, 5000);
  },
});
