import { defineContentScript } from '~/client';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {},
});
