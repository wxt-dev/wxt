import ReactDOM from 'react-dom/client';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    const container = document.createElement('div');
    document.body.append(container);

    ReactDOM.createRoot(container).render(<SomeComponent />);
  },
});

function SomeComponent() {
  return <div>Some component</div>;
}
