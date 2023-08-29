import { onMessage } from '@/utils/messaging';
import { registerMathService } from '@@/utils/math-service';

export default defineBackground(() => {
  // Basic Extension API listener
  browser.runtime.onMessage.addListener((message: any) => {
    // Ignore messages from the other messaging libraries by returning true - this tells the browser
    // a response will come in the future.
    if (message.type !== 'extension-api') return true;

    // Return a response inside a promise
    return Promise.resolve('ping -> pong');
  });

  // @webext-core/messaging listener
  onMessage('getStringLength', ({ data }) => {
    return data.length;
  });

  // @webext-core/proxy-service registration
  registerMathService();
});
