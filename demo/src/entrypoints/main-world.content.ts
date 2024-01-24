export default defineContentScript({
  // matches: ['*://*/*'],
  world: 'MAIN',
  include: 'chrome',

  main() {
    console.log(`Hello from ${location.hostname}!`);
  },
});
