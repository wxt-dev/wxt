import { defineAppConfig } from 'wxt/sandbox';

declare module 'wxt/sandbox' {
  export interface WxtAppConfig {
    example: string;
  }
}

export default defineAppConfig({
  example: 'value',
});
