import { DefaultTheme } from 'vitepress';

type SidebarItem = DefaultTheme.SidebarItem;
type NavItem = DefaultTheme.NavItem;

export function navItem(text: string, link: string): NavItem {
  return { text, link };
}

export function menuRoot(items: SidebarItem[]) {
  return items.map((item, index) => {
    // item.collapsed = false; // uncomment to expand all level-0 items
    return item;
  });
}

export function menuGroup(text: string, items: SidebarItem[]): SidebarItem;
export function menuGroup(
  text: string,
  base: string,
  items: SidebarItem[],
): SidebarItem;
export function menuGroup(
  text: string,
  a: string | SidebarItem[],
  b?: SidebarItem[],
): SidebarItem {
  const collapsed = true;
  if (typeof a === 'string') {
    return {
      text,
      base: a,
      items: b,
      collapsed,
    };
  }
  return {
    text,
    items: a,
    collapsed,
  };
}

export function menuItems(items: SidebarItem[]) {
  return {
    items,
  };
}

export function menuItem(text: string, link: string): SidebarItem {
  return { text, link };
}

/**
 * Clean up and add badges to typedoc leaf sections
 */
export function prepareTypedocSidebar(items: SidebarItem[]) {
  // skip contents file
  const filtered = items.slice(1);

  // remove Typedoc's collapse: true from text nodes
  const prepareItems = (items: DefaultTheme.SidebarItem[], depth = 0) => {
    for (const item of items) {
      if (item.items) {
        prepareItems(item.items, depth + 1);
        const hasLeaves = item.items.some((item) => !item.items);
        if (hasLeaves) {
          item.text += ` <span class="badge">${item.items.length}</span>`;
        }
      } else {
        delete item.collapsed;
      }
    }
  };

  // process
  prepareItems(filtered);

  // return
  return filtered;
}
