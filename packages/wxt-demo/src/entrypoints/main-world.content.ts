export default defineContentScript({
  matches: ['*://*/*'],
  world: 'MAIN',

  main() {
    console.log(`Hello from ${location.hostname}!`);
  },
});
