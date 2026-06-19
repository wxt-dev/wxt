import DefaultTheme from 'vitepress/theme';
import Icon from '../components/Icon.vue';
import EntrypointPatterns from '../components/EntrypointPatterns.vue';
import UsingWxtSection from '../components/UsingWxtSection.vue';
import ExampleSearch from '../components/ExampleSearch.vue';
import BlogLayout from '../components/BlogLayout.vue';
import './custom.css';
import 'virtual:group-icons.css';
import type { EnhanceAppContext } from 'vitepress/client';

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
    `label[for="${input.id}"]`
  );

  return label ? getTabTitle(label) : undefined;
}

function findCodeGroupTabIndex(group: HTMLElement, title: string) {
  return Array.from(group.querySelectorAll<HTMLLabelElement>(codeGroupSelectors.label)).findIndex(
    (label) => getTabTitle(label) === title
  );
}

function syncCodeGroupSelection(group: HTMLElement, title: string) {
  const targetIndex = findCodeGroupTabIndex(group, title);

  if (targetIndex < 0) return;

  const blocks = group.querySelector('.blocks');
  const targetBlock = blocks?.children[targetIndex];
  if (!blocks || !targetBlock || targetBlock.classList.contains('active')) return;

  blocks.querySelector('.active')?.classList.remove('active');
  targetBlock.classList.add('active');

  const input = group.querySelectorAll<HTMLInputElement>(codeGroupSelectors.input)[targetIndex];
  if (input) input.checked = true;
}

function syncCodeGroupTabs(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.matches(codeGroupSelectors.input)) return;

  const activeGroup = target.closest(codeGroupSelectors.root);
  const activeTitle = getCodeGroupTitle(target);
  if (!activeTitle) return;

  document.querySelectorAll<HTMLElement>(codeGroupSelectors.root).forEach((group) => {
    if (group === activeGroup) return;

    syncCodeGroupSelection(group, activeTitle);
  });
}

export default {
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    ctx.app
      .component('Icon', Icon)
      .component('EntrypointPatterns', EntrypointPatterns)
      .component('UsingWxtSection', UsingWxtSection)
      .component('ExampleSearch', ExampleSearch)
      .component('blog', BlogLayout);

    if (typeof window !== 'undefined') {
      window.addEventListener('change', syncCodeGroupTabs, true);
    }
  },
};
