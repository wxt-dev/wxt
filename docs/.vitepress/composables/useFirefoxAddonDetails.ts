import { ref } from 'vue';

export interface FirefoxAddonDisplay {
  slug: string;
  name: string;
  iconUrl: string;
  weeklyActiveUsers: number;
  shortDescription: string;
  rating: number | undefined;
  firefoxUrl: string;
}

function pickLocalized(
  value: Record<string, string> | string | undefined,
): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value['en-US'] ?? Object.values(value)[0] ?? '';
}

export default function useFirefoxAddonDetails(slugs: string[]) {
  const data = ref<FirefoxAddonDisplay[]>();
  const err = ref<unknown>();
  const isLoading = ref(true);

  if (slugs.length === 0) {
    data.value = [];
    isLoading.value = false;
    return {
      data,
      err,
      isLoading,
    };
  }

  async function fetchOne(slug: string): Promise<FirefoxAddonDisplay | null> {
    try {
      const res = await fetch(
        `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(slug)}/`,
      );
      if (!res.ok) {
        console.warn(
          `[useFirefoxAddonDetails] ${slug}: HTTP ${res.status} — skipping`,
        );
        return null;
      }
      const json = (await res.json()) as {
        slug?: string;
        name?: Record<string, string> | string;
        summary?: Record<string, string> | string;
        icons?: Record<string, string>;
        average_daily_users?: number;
        ratings?: { average?: number; bayesian_average?: number };
      };
      const canonicalSlug = json.slug ?? slug;
      const name = pickLocalized(json.name);
      const shortDescription = pickLocalized(json.summary);
      const iconUrl =
        json.icons?.['128'] ?? json.icons?.['64'] ?? json.icons?.['32'] ?? '';
      const rating =
        json.ratings?.average ?? json.ratings?.bayesian_average ?? undefined;
      const firefoxUrl = `https://addons.mozilla.org/firefox/addon/${canonicalSlug}/?utm_source=wxt.dev`;
      return {
        slug,
        name,
        iconUrl,
        weeklyActiveUsers: json.average_daily_users ?? 0,
        shortDescription,
        rating,
        firefoxUrl,
      } satisfies FirefoxAddonDisplay;
    } catch (e) {
      console.warn(`[useFirefoxAddonDetails] ${slug}:`, e);
      return null;
    }
  }

  Promise.all(slugs.map((slug) => fetchOne(slug)))
    .then((rows) => {
      const ok = rows.filter((r): r is FirefoxAddonDisplay => r != null);
      data.value = ok;
      err.value =
        ok.length === 0 && slugs.length > 0
          ? new Error('No Firefox addons could be loaded')
          : undefined;
      isLoading.value = false;
    })
    .catch((error) => {
      console.error(error);
      data.value = [];
      err.value = error;
      isLoading.value = false;
    });

  return {
    data,
    err,
    isLoading,
  };
}
