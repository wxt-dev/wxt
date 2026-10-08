import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isCI, loadEnv } from '../env-utils';

const cwd = process.cwd();

describe('Env Utils', () => {
  beforeEach(() => {
    if (process.cwd() !== cwd) process.chdir(cwd);
    delete process.env.TEST_VAR;
    delete process.env.EXPANDED;
    delete process.env.LOCAL_VAR;
    delete process.env.EXPANDED_FROM_LOCAL;
    delete process.env.OVERRIDDEN;
    delete process.env.EXPANDED_OVERRIDE;
    delete process.env.UNRESOLVED;
  });

  describe('isCI', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
      vi.stubEnv('CI', '');
    });

    it('should return false when CI is not set', () => {
      expect(isCI()).toBe(false);
    });

    it('should return true when CI is set', () => {
      vi.stubEnv('CI', 'true');
      expect(isCI()).toBe(true);
    });

    it('should return false when CI is explicitly false', () => {
      vi.stubEnv('CI', 'false');
      expect(isCI()).toBe(false);
    });
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

    it('should expand env vars into the real `process.env`', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.EXPANDED).toEqual('expected expanded');
    });

    it('should expand env vars defined in more specific files', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.EXPANDED_FROM_LOCAL).toEqual('local expanded');
    });

    it('should expand the value from the most specific file', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.EXPANDED_OVERRIDE).toEqual('local expanded');
    });

    it('should expand unresolved env vars to empty strings', () => {
      loadEnv('testing', 'chrome');
      expect(process.env.UNRESOLVED).toEqual(' unresolved');
    });
  });
});
