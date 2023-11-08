import { ref } from 'vue';

export interface ChromeExtension {
  id: string;
  name: string;
  iconUrl: string;
  weeklyActiveUsers: number;
  shortDescription: string;
  storeUrl: string;
  rating: number | undefined;
}

const operationName = 'WxtDocsUsedBy';
const query = `query ${operationName}($ids:[String!]!) {
  chromeExtensions(ids: $ids) {
    id
    name
    iconUrl
    weeklyActiveUsers
    shortDescription
    storeUrl
    rating
  }
}`;

export default function (ids: string[]) {
  const data = ref<ChromeExtension[]>();
  const err = ref<unknown>();

  fetch('https://queue.wxt.dev/api', {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables: { ids },
    }),
  })
    .then(async (res) => {
      const {
        data: { chromeExtensions },
      } = await res.json();
      data.value = chromeExtensions;
      err.value = undefined;
    })
    .catch((error) => {
      console.error(error);
      data.value = undefined;
      err.value = error;
    });

  return {
    data,
    err,
  };
}
