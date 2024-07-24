import { describe, expect, it } from 'vitest';
import { ContentSecurityPolicy } from '../content-security-policy';

describe('Content Security Policy Builder', () => {
  it('should add values to new directives correctly', () => {
    const csp = new ContentSecurityPolicy();

    csp.add('default-src', "'self'");

    expect(csp.toString()).toEqual("default-src 'self';");
  });

  it('should add to existing values', () => {
    const csp = new ContentSecurityPolicy("default-src 'self';");

    csp.add('default-src', 'http://localhost:*');

    expect(csp.toString()).toEqual("default-src 'self' http://localhost:*;");
  });

  it('should not add duplicates', () => {
    const csp = new ContentSecurityPolicy("default-src 'self';");

    csp.add('default-src', "'self'");

    expect(csp.toString()).toEqual("default-src 'self';");
  });

  it('should sort the directives in the correct order', () => {
    const csp = new ContentSecurityPolicy();

    csp.add('object-src', "'self'");
    csp.add('script-src', "'self'");
    csp.add('default-src', "'self'");

    expect(csp.toString()).toEqual(
      "default-src 'self'; script-src 'self'; object-src 'self';",
    );
  });
});
