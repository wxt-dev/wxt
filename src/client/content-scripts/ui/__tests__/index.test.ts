/** @vitest-environment happy-dom */
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { createIntegratedUi, createIframeUi, createShadowRootUi } from '..';
import { ContentScriptContext } from '../../content-script-context';

function appendTestApp(container: HTMLElement) {
  container.innerHTML = '<app>Hello world</app>';
}

const fetch = vi.fn();

describe('Content Script UIs', () => {
  let ctx: ContentScriptContext;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="parent">
        <p id="one">one</p>
        <p id="two">two</p>
        <p id="three"></p>
      </div>
    `;
    window.fetch = fetch;
    fetch.mockResolvedValue({ text: () => Promise.resolve('') });
    ctx = new ContentScriptContext('test');
  });

  describe('type', () => {
    describe('integrated', () => {
      it('should add a wrapper and custom UI to the page', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector('div[data-wxt-integrated]'),
        ).not.toBeNull();
        expect(document.querySelector('app')).not.toBeNull();
      });

      it('should allow customizing the wrapper tag', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          tag: 'pre',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector('pre[data-wxt-integrated]'),
        ).not.toBeNull();
        expect(document.querySelector('app')).not.toBeNull();
      });
    });

    describe('iframe', () => {
      it('should add a wrapper and iframe to the page', () => {
        const ui = createIframeUi(ctx, {
          page: '/page.html',
          position: 'inline',
        });
        ui.mount();

        expect(document.querySelector('div[data-wxt-iframe]')).toBeDefined();
        expect(document.querySelector('iframe')).toBeDefined();
      });
    });

    describe('shadow-root', () => {
      it('should load a shadow root to the page', async () => {
        const ui = await createShadowRootUi(ctx, {
          position: 'inline',
          name: 'test',
          onMount(uiContainer) {
            appendTestApp(uiContainer);
          },
        });
        ui.mount();

        expect(
          document.querySelector('test[data-wxt-shadow-root]'),
        ).not.toBeNull();
        expect(ui.shadow.querySelector('app')).not.toBeNull();
      });

      it.each([
        ['open', 'open'],
        [undefined, 'open'],
        ['closed', 'closed'],
      ] as const)(
        'should respect the shadow root mode (%s -> %s)',
        async (input, expected) => {
          const ui = await createShadowRootUi(ctx, {
            position: 'inline',
            name: 'test',
            mode: input,
            onMount: appendTestApp,
          });

          expect(ui.shadow.mode).toBe(expected);
        },
      );
    });
  });

  describe('position', () => {
    describe('inline', () => {
      it('should wrap the UI in a simple div', () => {
        const ui = createIframeUi(ctx, {
          position: 'inline',
          page: '/page.html',
        });

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe=""><iframe src="chrome-extension://test-extension-id/page.html"></iframe></div>"`,
        );
      });
    });

    describe('overlay', () => {
      it('should wrap the UI in a positioned div when alignment=undefined', () => {
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: absolute; top: 0px; left: 0px;"></iframe></div>"`,
        );
      });

      it('should wrap the UI in a positioned div when alignment=top-left', () => {
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
          alignment: 'top-left',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: absolute; top: 0px; left: 0px;"></iframe></div>"`,
        );
      });

      it('should wrap the UI in a positioned div when alignment=top-right', () => {
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
          alignment: 'top-right',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: absolute; top: 0px; right: 0px;"></iframe></div>"`,
        );
      });

      it('should wrap the UI in a positioned div when alignment=bottom-right', () => {
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
          alignment: 'bottom-right',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: absolute; bottom: 0px; right: 0px;"></iframe></div>"`,
        );
      });

      it('should wrap the UI in a positioned div when alignment=bottom-left', () => {
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
          alignment: 'bottom-left',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: absolute; bottom: 0px; left: 0px;"></iframe></div>"`,
        );
      });

      it('should respect the provided zIndex', () => {
        const zIndex = 123;
        const ui = createIframeUi(ctx, {
          position: 'overlay',
          page: '/page.html',
          zIndex,
        });
        ui.mount();

        expect(ui.wrapper.style.zIndex).toBe(String(zIndex));
      });
    });

    describe('modal', () => {
      it('should wrap the UI in a div with a fixed position', () => {
        const ui = createIframeUi(ctx, {
          position: 'modal',
          page: '/page.html',
        });
        ui.mount();

        expect(ui.wrapper.outerHTML).toMatchInlineSnapshot(
          `"<div data-wxt-iframe="" style="overflow: visible; position: relative; width: 0px; height: 0px; display: block;"><iframe src="chrome-extension://test-extension-id/page.html" style="position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px;"></iframe></div>"`,
        );
      });

      it('should respect the provided zIndex', () => {
        const zIndex = 123;
        const ui = createIframeUi(ctx, {
          position: 'modal',
          page: '/page.html',
          zIndex,
        });
        ui.mount();

        expect(ui.wrapper.style.zIndex).toBe(String(zIndex));
      });
    });
  });

  describe('anchor', () => {
    describe('undefined', () => {
      it('should append the element to the body', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector('body > div[data-wxt-integrated]'),
        ).not.toBeNull();
      });
    });

    describe('string', () => {
      it('should append the element using the specified query selector', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          onMount: appendTestApp,
          anchor: '#parent',
        });
        ui.mount();

        expect(
          document.querySelector('#parent > div[data-wxt-integrated]'),
        ).not.toBeNull();
      });
    });

    describe('Element', () => {
      it('should append the element using the specified element', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          onMount: appendTestApp,
          anchor: document.getElementById('parent'),
        });
        ui.mount();

        expect(
          document.querySelector('#parent > div[data-wxt-integrated]'),
        ).not.toBeNull();
      });
    });

    describe('function', () => {
      it('should append the element using the specified function', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          onMount: appendTestApp,
          anchor: () => document.getElementById('parent'),
        });
        ui.mount();

        expect(
          document.querySelector('#parent > div[data-wxt-integrated]'),
        ).not.toBeNull();
      });
    });

    it('should throw an error when the anchor does not exist', () => {
      const ui = createIntegratedUi(ctx, {
        position: 'inline',
        onMount: appendTestApp,
        anchor: () => document.getElementById('i-do-not-exist'),
      });

      expect(ui.mount).toThrow();
    });
  });

  describe('append', () => {
    describe.each([undefined, 'last'] as const)('%s', (append) => {
      it('should append the element as the last child of the anchor', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#parent',
          append,
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector(
            '#parent > div[data-wxt-integrated]:last-child',
          ),
        ).not.toBeNull();
      });
    });

    describe('first', () => {
      it('should append the element as the last child of the anchor', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#parent',
          append: 'first',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector(
            '#parent > div[data-wxt-integrated]:first-child',
          ),
        ).not.toBeNull();
      });
    });

    describe('replace', () => {
      it('should replace the the anchor', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#parent',
          append: 'replace',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector('body > div[data-wxt-integrated]'),
        ).not.toBeNull();
        expect(document.querySelector('#parent')).toBeNull();
      });
    });

    describe('before', () => {
      it('should append the UI before the anchor', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#one',
          append: 'before',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector(
            '#parent > div[data-wxt-integrated]:first-child',
          ),
        ).not.toBeNull();
      });
    });

    describe('after', () => {
      it('should append the UI after the anchor', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#three',
          append: 'after',
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector(
            '#parent > div[data-wxt-integrated]:last-child',
          ),
        ).not.toBeNull();
      });
    });

    describe('function', () => {
      it('should append the UI using a function', () => {
        const ui = createIntegratedUi(ctx, {
          position: 'inline',
          anchor: '#parent',
          append: (anchor, ui) => {
            anchor.replaceWith(ui);
          },
          onMount: appendTestApp,
        });
        ui.mount();

        expect(
          document.querySelector('body > div[data-wxt-integrated]'),
        ).not.toBeNull();
        expect(document.querySelector('#parent')).toBeNull();
      });
    });
  });
});
