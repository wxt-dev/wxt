export default defineBackgroundScript(() => {
  console.log('Hello background!', { id: browser.runtime.id });
});
