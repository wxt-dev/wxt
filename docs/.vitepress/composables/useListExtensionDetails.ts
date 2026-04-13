import { ref } from 'vue';

export interface Extension {
  id: string;
  name: string;
  iconUrl: string;
  shortDescription: string;
  storeUrl: string;
  rating: number | undefined;
  users: number;
}

export interface ExtensionResults {
  chrome: Extension[];
  firefox: Extension[];
}

const operationName = 'WxtDocsUsedBy';
const query = `query ${operationName}($chromeIds: [String!]!, $firefoxIds: [String!]!) {
  chromeExtensions(ids: $chromeIds) {
    id
    ...ExtensionData
  }
  firefoxAddons(ids: $firefoxIds) {
    id: slug
    ...ExtensionData
  }
}

fragment ExtensionData on Extension {
  name
  iconUrl
  shortDescription
  storeUrl
  rating
  users
}`;

export default function (chromeIds: string[], firefoxSlugs: string[]) {
  const data = ref<ExtensionResults>();
  const err = ref<unknown>();
  const isLoading = ref(true);

  if (chromeIds.length === 0 && firefoxSlugs.length === 0) {
    data.value = { chrome: [], firefox: [] };
    isLoading.value = false;
    return { data, err, isLoading };
  }

  fetch('https://queue.wxt.dev/api', {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables: { chromeIds, firefoxIds: firefoxSlugs },
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (res) => {
      isLoading.value = false;
      const { data: responseData } = await res.json();
      data.value = {
        chrome: responseData.chromeExtensions ?? [],
        firefox: responseData.firefoxAddons ?? [],
      };
      err.value = undefined;
    })
    .catch((error) => {
      isLoading.value = false;
      console.error(error);
      data.value = undefined;
      err.value = error;
    });

  return { data, err, isLoading };
}
