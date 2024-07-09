import { analytics } from '@/modules/analytics/client';

declare const enabledCheckbox: HTMLInputElement;

analytics.autoTrack(document);

enabledCheckbox.oninput = () => {
  void analytics.setEnabled(enabledCheckbox.checked);
};
