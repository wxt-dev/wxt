import '../../common/style.css';
import './style.css';

export default defineContentScript({
  matches: ['https://*.duckduckgo.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createContentScriptUi(ctx, {
      name: 'demo-ui',
      type: 'inline',
      append: 'before',
      anchor: 'form[role=search]',
      mount: (container) => {
        const app = document.createElement('div');
        app.textContent = 'Custom content script UI';
        container.append(app);
      },
    });
    ui.mount();

    setTimeout(ui.remove, 5000);
  },
});
