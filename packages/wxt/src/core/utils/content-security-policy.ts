/**
 * Directive names that make up CSPs. There are more, this is all I need for the plugin.
 */
export type CspDirective = 'default-src' | 'script-src' | 'object-src';

export class ContentSecurityPolicy {
  private static DIRECTIVE_ORDER: Record<string, number | undefined> = {
    'default-src': 0,
    'script-src': 1,
    'object-src': 2,
  };

  data: Record<string, string[]>;

  constructor(csp?: string | object) {
    if (csp) {
      let sections: string[];
      if (typeof csp === 'object') {
        // @ts-ignore
        sections = csp.extension_pages
          .split(';')
          .map((section) => section.trim());
      } else {
        sections = csp.split(';').map((section) => section.trim());
      }
      this.data = sections.reduce<Record<string, string[]>>((data, section) => {
        const [key, ...values] = section.split(' ').map((item) => item.trim());
        if (key) data[key] = values;
        return data;
      }, {});
    } else {
      this.data = {};
    }
  }

  /**
   * Ensure a set of values are listed under a directive.
   */
  add(directive: CspDirective, ...newValues: string[]): ContentSecurityPolicy {
    const values = this.data[directive] ?? [];
    newValues.forEach((newValue) => {
      if (!values.includes(newValue)) values.push(newValue);
    });
    this.data[directive] = values;
    return this;
  }

  toString(): string {
    const directives = Object.entries(this.data).sort(([l], [r]) => {
      const lo = ContentSecurityPolicy.DIRECTIVE_ORDER[l] ?? 2;
      const ro = ContentSecurityPolicy.DIRECTIVE_ORDER[r] ?? 2;
      return lo - ro;
    });
    return directives.map((entry) => entry.flat().join(' ')).join('; ') + ';';
  }
}
