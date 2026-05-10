import { analytics } from '#analytics';

declare const enabledCheckbox: HTMLInputElement;

analytics.autoTrack(document);

enabledCheckbox.oninput = () => {
  analytics.setEnabled(enabledCheckbox.checked);
};
