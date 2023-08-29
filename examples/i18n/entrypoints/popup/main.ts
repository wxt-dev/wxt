const I18N_ATTRIBUTE = 'data-i18n';

function localize() {
  const translatedElements = document.querySelectorAll(`*[${I18N_ATTRIBUTE}]`);

  translatedElements.forEach((element) => {
    const message = element.getAttribute(I18N_ATTRIBUTE);
    if (message) {
      element.textContent = browser.i18n.getMessage(message);
    }
  });
}

localize();
