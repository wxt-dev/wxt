import { faker } from '@faker-js/faker';

import { defineContentScript } from '../../../utils/define-content-script';

export default defineContentScript({
  matches: [faker.string.nanoid()],
  main() {},
});
