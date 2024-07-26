console.log(globalThis);

console.log(document);

export default defineContentScript({
  matches: ['*://*/*'],
  world: 'MAIN',

  main() {
    console.log(`Hello from ${location.hostname}!`);
  },
});
