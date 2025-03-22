import type {
  BackgroundEntrypointOptions,
  BaseEntrypointOptions,
  IsolatedWorldContentScriptEntrypointOptions,
  MainWorldContentScriptEntrypointOptions,
} from './option-types';
import type { ContentScriptContext } from './utils/content-script-context';

export type WxtPlugin = () => void;

export interface IsolatedWorldContentScriptDefinition
  extends IsolatedWorldContentScriptEntrypointOptions {
  /**
   * Main function executed when the content script is loaded.
   *
   * When running a content script with `browser.scripting.executeScript`,
   * values returned from this function will be returned in the `executeScript`
   * result as well. Otherwise returning a value does nothing.
   */
  main(ctx: ContentScriptContext): any | Promise<any>;
}

export interface MainWorldContentScriptDefinition
  extends MainWorldContentScriptEntrypointOptions {
  /**
   * Main function executed when the content script is loaded.
   *
   * When running a content script with `browser.scripting.executeScript`,
   * values returned from this function will be returned in the `executeScript`
   * result as well. Otherwise returning a value does nothing.
   */
  main(): any | Promise<any>;
}

export type ContentScriptDefinition =
  | IsolatedWorldContentScriptDefinition
  | MainWorldContentScriptDefinition;

export interface BackgroundDefinition extends BackgroundEntrypointOptions {
  /**
   * Main function executed when the background script is started. Cannot be async.
   */
  main(): void;
}

export interface UnlistedScriptDefinition extends BaseEntrypointOptions {
  /**
   * Main function executed when the unlisted script is ran.
   *
   * When running a content script with `browser.scripting.executeScript`,
   * values returned from this function will be returned in the `executeScript`
   * result as well. Otherwise returning a value does nothing.
   */
  main(): any | Promise<any>;
}
