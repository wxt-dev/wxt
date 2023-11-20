import ReactDOM from 'react-dom/client';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx) {
    console.log(browser.runtime.id);
    logId();

    console.log('WXT MODE:', {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });

    const n = (Math.random() * 100).toFixed(1);
    ctx.setInterval(() => {
      console.log(n, browser.runtime.id);
    }, 1e3);

    const container = document.createElement('div');
    document.body.append(container);

    ReactDOM.createRoot(container).render(<SomeComponent />);
  },
});

function SomeComponent() {
  return <div>Some component</div>;
}
