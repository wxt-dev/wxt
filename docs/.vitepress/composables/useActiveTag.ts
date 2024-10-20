import { useRoute } from 'vitepress';
import { computed, toRaw } from 'vue';

export function useActiveTag() {
  const route = useRoute();
  return computed<string | undefined>(() => {
    return (
      // Access route to re-run on change
      route.data &&
      (new URL(location.href).searchParams.get('tag') ?? undefined)
    );
  });
}
