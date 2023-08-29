const installDate = document.querySelector<HTMLSpanElement>('#installDate')!;
const lastStartedAt =
  document.querySelector<HTMLSpanElement>('#lastStartedAt')!;

void browser.storage.local
  .get(['installDate', 'lastStartedAt'])
  .then((values) => {
    installDate.textContent = values.installDate;
    lastStartedAt.textContent = values.lastStartedAt;
  });
