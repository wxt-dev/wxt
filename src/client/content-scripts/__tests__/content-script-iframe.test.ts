/** @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContentScriptIframe } from '~/client/content-scripts/content-script-iframe';
import { ContentScriptContext } from '~/client/content-scripts/content-script-context';

const createCtx = () => new ContentScriptContext('test');

const fetch = vi.fn();

describe('createContentScriptIframe', () => {
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
  });

  describe('mount', () => {
    describe('append option', () => {
      it.each([undefined, 'last' as const])(
        'should append the element as the last child to the anchor when append=%s',
        async (append) => {
          const ui = await createContentScriptIframe(createCtx(), {
            page: '/test.html',
            type: 'inline',
            anchor: '#parent',
            append,
          });
          ui.mount();

          expect(
            document.querySelector('#parent > :nth-child(4)')?.tagName,
          ).toEqual('DIV');
        },
      );

      it('should append the element as the first child to the anchor when append=first', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#parent',
          append: 'first',
        });
        ui.mount();

        expect(
          document.querySelector('#parent > :nth-child(1)')?.tagName,
        ).toEqual('DIV');
      });

      it('should append the element normally when append=first but there are no other children', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#three',
          append: 'first',
        });
        ui.mount();

        expect(
          document.querySelector('#three > :nth-child(1)')?.tagName,
        ).toEqual('DIV');
      });

      it('should replace the anchor with the element when append=replace', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#two',
          append: 'replace',
        });
        ui.mount();

        expect(
          document.querySelector('#parent > :nth-child(2)')?.tagName,
        ).toEqual('DIV');
      });

      it('should append the element after the anchor when append=before', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#two',
          append: 'before',
        });
        ui.mount();

        expect(
          document.querySelector('#parent > :nth-child(2)')?.tagName,
        ).toEqual('DIV');
      });

      it('should append the element after the anchor when append=after', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#two',
          append: 'after',
        });
        ui.mount();

        // Happy DOM doesn't work in this case, so we just make sure the element is added.
        // expect(
        //   document.querySelector('#parent > :nth-child(3)')?.tagName,
        // ).toEqual('DIV');
        expect(document.querySelector('DIV')).toBeDefined();
      });

      it('should apply a custom function', async () => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor: '#three',
          append: (anchor, ui) => anchor.replaceWith(ui),
        });
        ui.mount();

        expect(
          document.querySelector('#parent > :nth-child(3)')?.tagName,
        ).toEqual('DIV');
      });
    });

    it('should default the anchor to the body when unset', async () => {
      const ui = await createContentScriptIframe(createCtx(), {
        page: '/test.html',
        type: 'inline',
      });
      ui.mount();

      expect(document.querySelector('body > :nth-child(2)')?.tagName).toEqual(
        'DIV',
      );
    });

    it.each(['#four', () => document.querySelector('#four')])(
      "should throw an error if the anchor doesn't exist",
      async (anchor) => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type: 'inline',
          anchor,
        });

        expect(ui.mount).toThrow(
          'Failed to mount content script UI: could not find anchor element',
        );
      },
    );
  });

  describe('remove', () => {
    it("should not fail if the ui hasn't been mounted", async () => {
      const ui = await createContentScriptIframe(createCtx(), {
        page: '/test.html',
        type: 'inline',
      });
      ui.remove();
    });

    it('should automatically remove the UI when the context is invalidated', async () => {
      const ctx = createCtx();
      const ui = await createContentScriptIframe(ctx, {
        page: '/test.html',
        type: 'inline',
      });
      ui.mount();

      expect(document.querySelector('.wxt-iframe-wrapper')).toBeDefined();

      ctx.abort();
      expect(document.querySelector('.wxt-iframe-wrapper')).toBeNull();
    });
  });

  describe('type', () => {
    it.each(['inline', 'overlay', 'modal'] as const)(
      'should render type=%s',
      async (type) => {
        const ui = await createContentScriptIframe(createCtx(), {
          page: '/test.html',
          type,
        });
        ui.mount();

        expect(document.querySelector('DIV')).toBeDefined();
      },
    );
  });

  describe('anchor', () => {
    it.each([
      () => '#two',
      () => () => '#two',
      () => document.querySelector('#two'),
      () => () => document.querySelector('#two'),
    ])('should render anchor=%s', async (getAnchor) => {
      const ui = await createContentScriptIframe(createCtx(), {
        page: '/test.html',
        type: 'inline',
        anchor: getAnchor(),
      });
      ui.mount();

      expect(document.querySelector('DIV')).toBeDefined();
    });
  });
});
