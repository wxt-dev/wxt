import { defineContentScript } from '../../../utils/define-content-script';

export default defineContentScript({
  matches: [crypto.randomUUID()],
  main() {},
});
