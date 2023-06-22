import { Entrypoint } from '..';
import { EntrypointGroup } from '../types';

/**
 * Entrypoints can be build in groups. HTML pages can all be built together in a single step, while
 * content scripts must be build individually.
 *
 * This function returns the entrypoints put into these types of groups.
 */
export function groupEntrypoints(entrypoints: Entrypoint[]): EntrypointGroup[] {
  const groupIndexMap: Partial<Record<Group, number>> = {};
  const groups: EntrypointGroup[] = [];

  for (const entry of entrypoints) {
    const group = ENTRY_TYPE_TO_GROUP_MAP[entry.type];
    if (group === 'no-group') {
      groups.push(entry);
    } else {
      let groupIndex = groupIndexMap[group];
      if (groupIndex == null) {
        groupIndex = groups.push([]) - 1;
        groupIndexMap[group] = groupIndex;
      }
      (groups[groupIndex] as Entrypoint[]).push(entry);
    }
  }

  return groups;
}

const ENTRY_TYPE_TO_GROUP_MAP: Record<Entrypoint['type'], Group> = {
  sandbox: 'sandbox-page',

  popup: 'extension-page',
  newtab: 'extension-page',
  history: 'extension-page',
  options: 'extension-page',
  devtools: 'extension-page',
  bookmarks: 'extension-page',
  sidepanel: 'extension-page',
  'unlisted-page': 'extension-page',

  background: 'no-group',
  'content-script': 'no-group',
  'unlisted-script': 'no-group',
};

type Group = 'extension-page' | 'sandbox-page' | 'no-group';
