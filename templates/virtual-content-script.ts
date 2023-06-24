import definition from '{{moduleId}}';

(async () => {
  try {
    await definition.main();
  } catch (err) {
    console.error('The content script crashed on startup!\n\n', err);
  }
})();
