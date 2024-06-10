import { HeadConfig } from 'vitepress/types/shared';

export function meta(
  property: string,
  content: string,
  useName = false,
): HeadConfig {
  return [
    'meta',
    {
      [useName ? 'name' : 'property']: property,
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
