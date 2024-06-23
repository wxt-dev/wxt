import { HeadConfig } from 'vitepress/types/shared';

export function meta(
  property: string,
  content: string,
  options?: { useName: boolean },
): HeadConfig {
  return [
    'meta',
    {
      [options?.useName ? 'name' : 'property']: property,
      content,
    },
  ];
}

export function script(
  src: string,
  props: Record<string, string> = {},
): HeadConfig {
  return [
    'script',
    {
      ...props,
      src,
    },
  ];
}
