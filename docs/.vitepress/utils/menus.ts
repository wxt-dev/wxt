import { DefaultTheme } from 'vitepress';

type SidebarItem = DefaultTheme.SidebarItem;
type NavItem = DefaultTheme.NavItem;
type NavItemWithLink = DefaultTheme.NavItemWithLink;
type NavItemWithChildren = DefaultTheme.NavItemWithChildren;
type NavItemChildren = DefaultTheme.NavItemChildren;

export function navItem(text: string): NavItemChildren;
export function navItem(text: string, link: string): NavItemChildren;
export function navItem(text: string, items: any[]): NavItemWithChildren;
export function navItem(text: string, arg2?: unknown): any {
  if (typeof arg2 === 'string') {
    return { text, link: arg2 };
  } else if (Array.isArray(arg2)) {
    return { text, items: arg2 };
  }
  return { text };
}

export function menuRoot(items: SidebarItem[]) {
  return items.map((item, index) => {
    // item.collapsed = false; // uncomment to expand all level-0 items
    return item;
  });
}

export function menuGroup(
  text: string,
  items: SidebarItem[],
  collapsable?: boolean,
): SidebarItem;
export function menuGroup(
  text: string,
  base: string,
  items: SidebarItem[],
  collapsable?: boolean,
): SidebarItem;
export function menuGroup(
  text: string,
  a: string | SidebarItem[],
  b?: SidebarItem[] | boolean,
  c?: boolean,
): SidebarItem {
  if (typeof a === 'string' && Array.isArray(b)) {
    return {
      text,
      base: a,
      items: b,
      collapsed: c,
    };
  }
  if (typeof a !== 'string' && !Array.isArray(b))
    return {
      text,
      items: a,
      collapsed: b,
    };

  throw Error('Unknown overload');
}

export function menuItems(items: SidebarItem[]) {
  return {
    items,
  };
}

export function menuItem(
  text: string,
  link: string,
  items?: SidebarItem[],
): SidebarItem {
  if (items) {
    return { text, link, items };
  }
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
