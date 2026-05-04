import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'rem-fix-demo',
      position: 'inline',
      anchor: 'body',
      append: 'first',
      onMount(container) {
        const card = document.createElement('div');
        card.classList.add('rem-fix-card');

        const title = document.createElement('h3');
        title.textContent = 'rem → px Demo';

        const desc = document.createElement('p');
        desc.textContent =
          'This UI uses rem units in CSS, converted to px at build time by postcss-rem-to-responsive-pixel. ' +
          'It will render at the same size regardless of the host pages root font-size.';

        card.append(title, desc);
        container.append(card);
      },
    });

    ui.mount();
  },
});
