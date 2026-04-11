import type { Browser } from '@wxt-dev/browser';
import type { BuildOutput, ThemeIcon } from '../../types';
import { normalizePath } from './paths';
import { wxt } from '../wxt';

/**
 * Firefox only.
 *
 * If the manifest has an `action` (MV3) or `browser_action` (MV2) and the user
 * has not already set `theme_icons` on it, discover light/dark icon pairs from
 * the public assets and attach them.
 */
export function addDiscoveredThemeIcons(
  manifest: Browser.runtime.Manifest,
  buildOutput: Omit<BuildOutput, 'manifest'>,
): void {
  const action = manifest.action ?? manifest.browser_action;
  if (action == null) return;

  // Respect explicit user config or popup entrypoint option.
  if ((action as { theme_icons?: ThemeIcon[] }).theme_icons != null) return;

  const themeIcons = discoverThemeIcons(buildOutput);
  if (themeIcons == null) return;

  (action as { theme_icons?: ThemeIcon[] }).theme_icons = themeIcons;
}

/**
 * Scan `publicAssets` for paired `-light`/`-dark` icon files and return the
 * sizes where both variants exist, sorted ascending. Returns `undefined` if no
 * complete pairs are found so callers can short-circuit.
 */
export function discoverThemeIcons(
  buildOutput: Omit<BuildOutput, 'manifest'>,
): ThemeIcon[] | undefined {
  const bySize = new Map<number, { light?: string; dark?: string }>();

  for (const asset of buildOutput.publicAssets) {
    for (const regex of themeIconRegex) {
      const match = asset.fileName.match(regex);
      if (match?.groups == null) continue;

      const size = Number(match.groups.size);
      const variant = match.groups.variant as 'light' | 'dark';
      const entry = bySize.get(size) ?? {};

      const incoming = normalizePath(asset.fileName);
      const existing = entry[variant];
      if (existing != null && existing !== incoming) {
        wxt.logger.warn(
          `Multiple theme icon files matched size ${size} variant "${variant}": keeping "${existing}", ignoring "${incoming}". Use a single naming pattern per (size, variant).`,
        );
        break;
      }

      entry[variant] = incoming;
      bySize.set(size, entry);
      break;
    }
  }

  const pairs: ThemeIcon[] = [];
  for (const [size, entry] of bySize) {
    if (entry.light != null && entry.dark != null) {
      pairs.push({ light: entry.light, dark: entry.dark, size });
      continue;
    }
    const present = entry.light != null ? 'light' : 'dark';
    const missing = entry.light != null ? 'dark' : 'light';
    const file = entry.light ?? entry.dark;
    wxt.logger.warn(
      `Skipping theme icon size ${size}: found ${present} variant ("${file}") but no matching ${missing} variant. Add the missing file to include this size in theme_icons.`,
    );
  }
  pairs.sort((a, b) => a.size - b.size);

  return pairs.length > 0 ? pairs : undefined;
}

// prettier-ignore
// #region snippet
const themeIconRegex = [
  /^icon-(?<variant>light|dark)-(?<size>[0-9]+)\.png$/,              // icon-light-16.png
  /^icon-(?<variant>light|dark)-(?<size>[0-9]+)x[0-9]+\.png$/,       // icon-light-16x16.png
  /^icon-(?<size>[0-9]+)-(?<variant>light|dark)\.png$/,              // icon-16-light.png
  /^icon-(?<size>[0-9]+)x[0-9]+-(?<variant>light|dark)\.png$/,       // icon-16x16-light.png
  /^icons?[/\\](?<variant>light|dark)-(?<size>[0-9]+)\.png$/,        // icon/light-16.png | icons/light-16.png
  /^icons?[/\\](?<variant>light|dark)-(?<size>[0-9]+)x[0-9]+\.png$/, // icon/light-16x16.png
  /^icons?[/\\](?<size>[0-9]+)-(?<variant>light|dark)\.png$/,        // icon/16-light.png
  /^icons?[/\\](?<size>[0-9]+)x[0-9]+-(?<variant>light|dark)\.png$/, // icon/16x16-light.png
];
// #endregion snippet
