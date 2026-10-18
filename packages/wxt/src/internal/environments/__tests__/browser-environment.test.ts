import { describe, it, expect } from 'vitest';
import {
  createBrowserEnvironment,
  getBrowserEnvironmentGlobals,
} from '../browser-environment';

describe('Browser Environment', () => {
  describe('getBrowserEnvironmentGlobals', () => {
    it('should define location alongside window and document', () => {
      const globals = getBrowserEnvironmentGlobals();

      expect(globals.location).toBeDefined();
      expect(globals.window.location).toBeDefined();
      expect(globals.self.location).toBeDefined();
    });

    it('should give location the fields browser detection reads', () => {
      const { location } = getBrowserEnvironmentGlobals();

      expect(location.href).toBe('http://localhost/');
      expect(location.protocol).toBe('http:');
      expect(location.hostname).toBe('localhost');
      expect(location.origin).toBe('http://localhost');
      expect(location.pathname).toBe('/');
      expect(String(location)).toBe('http://localhost/');
    });
  });

  describe('createBrowserEnvironment', () => {
    it('should let a dependency that detects a browser read location.href', async () => {
      const env = createBrowserEnvironment();

      const href = await env.run(async () => {
        const hasBrowserEnv =
          typeof window !== 'undefined' && typeof document !== 'undefined';
        expect(hasBrowserEnv).toBe(true);
        return window.location.href;
      });

      expect(href).toBe('http://localhost/');
    });

    it('should apply location to globalThis during setup', () => {
      const teardown = createBrowserEnvironment().setup();
      try {
        expect(globalThis.location?.href).toBe('http://localhost/');
      } finally {
        teardown();
      }
    });
  });
});
