import { analytics } from '#analytics';
import { browser } from '@wxt-dev/browser';

declare const enabledCheckbox: HTMLInputElement;
declare const captureErrorButton: HTMLButtonElement;
declare const backgroundErrorButton: HTMLButtonElement;
declare const backgroundRejectionButton: HTMLButtonElement;

analytics.autoTrack(document);

enabledCheckbox.oninput = () => {
  void analytics.setEnabled(enabledCheckbox.checked);
};

captureErrorButton.onclick = () => {
  void analytics.captureException(new Error('Handled popup error (test)'), {
    source: 'popup',
  });
};
backgroundErrorButton.onclick = () => {
  void browser.runtime.sendMessage('throw-error');
};
backgroundRejectionButton.onclick = () => {
  void browser.runtime.sendMessage('reject-promise');
};
