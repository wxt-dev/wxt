import { definePeleDiagram } from 'vitepress-pele/client';
import { type EnhanceAppContext } from 'vitepress/client';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';

import BlogLayout from '../components/BlogLayout.vue';
import EntrypointPatterns from '../components/EntrypointPatterns.vue';

import './custom.css';
import 'virtual:group-icons.css';
import 'vitepress-pele/style.css';

import ExampleSearch from '../components/ExampleSearch.vue';
import Icon from '../components/Icon.vue';
import UsingWxtSection from '../components/UsingWxtSection.vue';
import { setupCodeGroupSync } from '../utils/code-groups-sync';

export default {
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    ctx.app
      .component('Icon', Icon)
      .component('EntrypointPatterns', EntrypointPatterns)
      .component('UsingWxtSection', UsingWxtSection)
      .component('ExampleSearch', ExampleSearch)
      .component('blog', BlogLayout);

    definePeleDiagram();
    setupCodeGroupSync();
  },
  Layout: () => {
    return h(DefaultTheme.Layout);
  },
};
