export type WxtPlugin = () => void;

export function defineWxtPlugin(plugin: WxtPlugin): WxtPlugin {
  return plugin;
}
