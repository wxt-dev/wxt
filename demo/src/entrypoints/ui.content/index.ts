import '../../common/style.css';
import './style.css';

export default defineContentScript({
  matches: ['https://*.duckduckgo.com/*'],
  cssInjectionMode: 'ui',
  type: 'module',

  async main(ctx) {
    logId();
    const ui = await createShadowRootUi(ctx, {
      name: 'demo-ui',
      position: 'inline',
      append: 'before',
      anchor: 'form[role=search]',
      onMount: (container) => {
        const app = document.createElement('div');
        app.textContent = 'Custom content script UI';
        container.append(app);
      },
    });
    ui.mount();

    setTimeout(ui.remove, 5000);
  },
});
