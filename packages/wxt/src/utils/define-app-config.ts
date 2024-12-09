export interface WxtAppConfig {}

/**
 * Runtime app config defined in `<srcDir>/app.config.ts`.
 *
 * You can add fields to this interface via ["Module Augmentation"](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation):
 *
 * ```ts
 * // app.config.ts
 * import 'wxt/sandbox';
 *
 * declare module "wxt/sandbox" {
 *   export interface WxtAppConfig {
 *     analytics: AnalyticsConfig
 *   }
 * }
 * ```
 */
export function defineAppConfig(config: WxtAppConfig): WxtAppConfig {
  return config;
}
