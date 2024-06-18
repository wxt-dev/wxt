import { browser } from 'wxt/browser';
import { defineWxtPlugin } from 'wxt/sandbox';
import { initBackground } from './entrypoints/background';
import { initHtml } from './entrypoints/html';
import { initScript } from './entrypoints/script';

export default <any>defineWxtPlugin(() => {
  if (location.pathname === '/background.js') initBackground();
  else if (location.hostname === browser.runtime.id) initHtml();
  else initScript();
});
