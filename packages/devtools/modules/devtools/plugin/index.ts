import { defineWxtPlugin } from 'wxt/sandbox';
import { initBackground } from './background';
import { initHtmlPage } from './html-page';
import { initScript } from './script';

export default defineWxtPlugin(() => {
  if (location.pathname === '/background.js') initBackground();
  else if (location.hostname === browser.runtime.id) initHtmlPage();
  else initScript();
});
