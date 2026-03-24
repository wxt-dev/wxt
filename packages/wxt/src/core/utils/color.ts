import { styleText } from 'node:util';

export type ColorFormatter = (text: string) => string;
type ColorFormat = Parameters<typeof styleText>[0];

export const color = {
  format(format: ColorFormat, text: string): string {
    return styleText(format, text);
  },
  bold(text: string): string {
    return styleText('bold', text);
  },
  blue(text: string): string {
    return styleText('blue', text);
  },
  cyan(text: string): string {
    return styleText('cyan', text);
  },
  dim(text: string): string {
    return styleText('dim', text);
  },
  gray(text: string): string {
    return styleText('gray', text);
  },
  green(text: string): string {
    return styleText('green', text);
  },
  magenta(text: string): string {
    return styleText('magenta', text);
  },
  red(text: string): string {
    return styleText('red', text);
  },
  yellow(text: string): string {
    return styleText('yellow', text);
  },
};
