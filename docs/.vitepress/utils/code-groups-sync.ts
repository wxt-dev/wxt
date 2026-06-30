const CODE_GROUP_SELECTORS = {
  root: '.vp-code-group',
  input: '.vp-code-group .tabs input',
  label: '.tabs label',
} as const;

function getTabTitle(label: HTMLLabelElement) {
  return label.dataset.title?.trim() || label.textContent?.trim();
}

function getCodeGroupTitle(input: HTMLInputElement) {
  const label = input.parentElement?.querySelector<HTMLLabelElement>(
    `label[for="${input.id}"]`,
  );

  return label ? getTabTitle(label) : undefined;
}

function findCodeGroupTabIndex(group: HTMLElement, title: string) {
  return Array.from(
    group.querySelectorAll<HTMLLabelElement>(CODE_GROUP_SELECTORS.label),
  ).findIndex((label) => getTabTitle(label) === title);
}

function syncCodeGroupSelection(group: HTMLElement, title: string) {
  const targetIndex = findCodeGroupTabIndex(group, title);

  if (targetIndex < 0) return;

  const blocks = group.querySelector('.blocks');
  const targetBlock = blocks?.children[targetIndex];
  if (!blocks || !targetBlock || targetBlock.classList.contains('active'))
    return;

  blocks.querySelector('.active')?.classList.remove('active');
  targetBlock.classList.add('active');

  const input = group.querySelectorAll<HTMLInputElement>(
    CODE_GROUP_SELECTORS.input,
  )[targetIndex];
  if (input) input.checked = true;
}

function syncCodeGroupTabs(event: Event) {
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) ||
    !target.matches(CODE_GROUP_SELECTORS.input)
  )
    return;

  const activeGroup = target.closest(CODE_GROUP_SELECTORS.root);
  const activeTitle = getCodeGroupTitle(target);
  if (!activeTitle) return;

  document
    .querySelectorAll<HTMLElement>(CODE_GROUP_SELECTORS.root)
    .forEach((group) => {
      if (group === activeGroup) return;

      syncCodeGroupSelection(group, activeTitle);
    });
}

/**
 * Keeps every code group on the page in sync: selecting a package manager (or
 * any tab) in one group switches the matching tab in all the other groups.
 */
export function setupCodeGroupSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('change', syncCodeGroupTabs, true);
}
