import { beforeEach, describe, expect, it } from 'vitest';
import { loadEnv } from '../env';

const cwd = process.cwd();

describe('Env Utils', () => {
  beforeEach(() => {
    if (process.cwd() !== cwd) process.chdir(cwd);
    delete process.env.TEST_VAR;
    delete process.env.EXPANDED;
  });

  describe('loadEnv', () => {
    beforeEach(() => {
      process.chdir(`${import.meta.dirname}/fixtures`);
    });

    it('should load env vars into the real `process.env`', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.TEST_VAR).toEqual('expected');
    });

    it('should override blank strings in process.env', () => {
      process.env.TEST_VAR = '';
      loadEnv('testing', 'chrome');
      expect(process.env.TEST_VAR).toEqual('expected');
    });

    it('should not override non-blank strings in process.env', () => {
      process.env.TEST_VAR = 'non-blank';
      loadEnv('testing', 'chrome');
      expect(process.env.TEST_VAR).toEqual('non-blank');
    });

    // Node doesn't return vars in the same order as they're defined:
    // https://github.com/nodejs/node/issues/62736
    it.skip('should expand env vars into the real `process.env`', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.EXPANDED).toEqual('expected expanded');
    });
  });
});
