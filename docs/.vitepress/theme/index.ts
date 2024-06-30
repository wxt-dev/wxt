import DefaultTheme from 'vitepress/theme';
import Icon from '../components/Icon.vue';
import EntrypointPatterns from '../components/EntrypointPatterns.vue';
import UsingWxtSection from '../components/UsingWxtSection.vue';
import ExampleSearch from '../components/ExampleSearch.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    ctx.app.component('Icon', Icon);
    ctx.app.component('EntrypointPatterns', EntrypointPatterns);
    ctx.app.component('UsingWxtSection', UsingWxtSection);
    ctx.app.component('ExampleSearch', ExampleSearch);
  },
};
