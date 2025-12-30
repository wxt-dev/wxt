import { defineAppConfig } from '#imports';

declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    EXAMPLE: string;
  }
}

export default defineAppConfig({
  EXAMPLE: 'Example Env Value',
});
