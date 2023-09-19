import { ConfigEnv, UserConfig, WxtViteConfig } from '../types';

export async function resolveUserViteConfig(
  config: UserConfig['vite'],
  env: ConfigEnv,
): Promise<WxtViteConfig> {
  if (typeof config === 'function') return await config(env);
  return config ?? {};
}
