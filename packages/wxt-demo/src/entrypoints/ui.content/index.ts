import '../../common/style.css';
import './style.css';

export default defineContentScript({
  matches: ['https://*.duckduckgo.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'demo-ui',
      position: 'inline',
      append: 'before',
      anchor: 'form[role=search]',
      onMount: (container) => {
        const app = document.createElement('div');
        app.textContent = i18n.t('prompt_for_name');
        container.append(app);
      },
    });
    ui.mount();

    setTimeout(ui.remove, 5000);
  },
});
