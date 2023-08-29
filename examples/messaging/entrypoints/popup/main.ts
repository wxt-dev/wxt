import { getMathService } from '@@/utils/math-service';
import { sendMessage } from '@@/utils/messaging';

const mathService = getMathService();

// Extension API
const extensionApiSend =
  document.querySelector<HTMLButtonElement>('#extensionApiSend')!;
const extensionApiResponse = document.querySelector<HTMLButtonElement>(
  '#extensionApiResponse',
)!;
extensionApiSend.addEventListener('click', async () => {
  extensionApiResponse.textContent = String(
    await browser.runtime.sendMessage({ type: 'extension-api', data: 'ping' }),
  );
});

// @webext-core/messaging
const messagingLibSend =
  document.querySelector<HTMLButtonElement>('#messagingLibSend')!;
const messagingLibResponse = document.querySelector<HTMLButtonElement>(
  '#messagingLibResponse',
)!;
messagingLibSend.addEventListener('click', async () => {
  messagingLibResponse.textContent = String(
    await sendMessage('getStringLength', 'Hello world!'),
  );
});

// @webext-core/proxy-service
const proxyServiceSend =
  document.querySelector<HTMLButtonElement>('#proxyServiceSend')!;
const proxyServiceResponse = document.querySelector<HTMLButtonElement>(
  '#proxyServiceResponse',
)!;
proxyServiceSend.addEventListener('click', async () => {
  proxyServiceResponse.textContent = String(await mathService.fibbonnaci(10));
});
