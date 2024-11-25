import 'uno.css';
import './style.css';

export default defineContentScript({
  matches: ['https://*.duckduckgo.com/*'],
  cssInjectionMode: 'manifest',

  async main(ctx) {
    const dynamicUI = createIntegratedUi(ctx, {
      position: 'inline',
      append: 'after',
      anchor: 'form[role=search]',
      onMount: (container) => {
        const app = document.createElement('div');
        app.id = 'automount-anchor';
        app.classList.add('m-4', 'text-center', 'text-red-500');
        app.textContent = i18n.t('prompt_for_name');
        container.append(app);
        return { container, app };
      },
      onRemove(mounted) {
        mounted?.container.remove();
        mounted?.app.remove();
        console.log('dynamicUI removed done');
      },
    });

    const autoMountUi = createIntegratedUi(ctx, {
      position: 'inline',
      append: 'after',
      anchor: '#automount-anchor',
      onMount: (container) => {
        const app = document.createElement('div');
        setTimeout(() => {
          app.id = 'automount-ui';
          app.classList.add('m-4', 'text-center', 'text-blue-500');
          app.textContent = `Hello, I'm automount UI.`;
          container.append(app);
        }, 1000);
        return { container, app };
      },
      onRemove(mounted) {
        mounted?.container.remove();
        mounted?.app.remove();
        console.log('autoMountUi removed done');
      },
    });

    let isStoppedAutoMount = false;
    const stopAutoMount = autoMountUi.autoMount({
      onStop: () => {
        isStoppedAutoMount = true;
        console.log('Auto mount stopped.');
      },
    });

    const stopAutoMountButton = createIntegratedUi(ctx, {
      position: 'inline',
      append: 'last',
      anchor: 'form[role=search]',
      onMount: (container) => {
        const app = document.createElement('button');
        container.classList.add('flex', 'flex-justify-center');
        app.classList.add('mt-4', 'p-2');
        app.textContent = 'Stop auto-mount';
        app.onclick = (e) => {
          e.preventDefault();
          stopAutoMount();
        };
        container.append(app);
        return { container, app };
      },
      onRemove(mounted) {
        mounted?.container.remove();
        mounted?.app.remove();
        console.log('dynamicUI removed done');
      },
    });

    stopAutoMountButton.mount();

    setInterval(() => {
      if (dynamicUI.mounted) {
        dynamicUI.remove();
        isStoppedAutoMount && autoMountUi.remove();
      } else {
        dynamicUI.mount();
      }
    }, 2000);
  },
});
