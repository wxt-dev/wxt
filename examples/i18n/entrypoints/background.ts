export default defineBackground(() => {
  console.log('Hello from ' + browser.i18n.getMessage('extName'));
});
