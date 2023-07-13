export default defineBackgroundScript(() => {
  console.log('Hello background!', browser.runtime.id);
});
