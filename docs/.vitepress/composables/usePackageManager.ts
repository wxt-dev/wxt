import { onMounted, ref } from 'vue';

export type PackageManager = 'npm' | 'pnpm' | 'bun' | 'yarn';

export const packageManagers: PackageManager[] = ['npm', 'pnpm', 'bun', 'yarn'];

const STORAGE_KEY = 'wxt-docs-package-manager';

// Shared between every component on the page so they all switch together.
const current = ref<PackageManager>('npm');
let restored = false;

export function usePackageManager() {
  onMounted(() => {
    if (restored) return;
    restored = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
      if (saved && packageManagers.includes(saved)) current.value = saved;
    } catch {
      // Storage unavailable, keep the default.
    }
  });

  function select(pm: PackageManager) {
    current.value = pm;
    try {
      localStorage.setItem(STORAGE_KEY, pm);
    } catch {
      // Storage unavailable, the selection just won't persist.
    }
  }

  return { current, select };
}

/** Yarn has no `dlx`-style init, the docs tell users to start with NPM. */
export const initCommands: Record<PackageManager, string> = {
  npm: 'npx wxt@latest init',
  pnpm: 'pnpm dlx wxt@latest init',
  bun: 'bunx wxt@latest init',
  yarn: 'npx wxt@latest init',
};

/** Runs a binary from the project's dependencies, like `wxt submit`. */
export function binCommand(pm: PackageManager, bin: string): string {
  const runner = { npm: 'npx', pnpm: 'pnpm', bun: 'bunx', yarn: 'yarn' }[pm];
  return `${runner} ${bin}`;
}

export function scriptCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' || pm === 'bun'
    ? `${pm} run ${script}`
    : `${pm} ${script}`;
}
