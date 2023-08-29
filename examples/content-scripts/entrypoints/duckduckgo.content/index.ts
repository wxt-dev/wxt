import './style.css';

export default defineContentScript({
  matches: ['*://*.duckduckgo.com/*'],
  main() {
    console.log('Content script with imported CSS styles');
  },
});
