import { defineContentScript } from '../../../../../sandbox';
import { faker } from '@faker-js/faker';

export default defineContentScript({
  matches: [faker.string.nanoid()],
  main() {},
});
