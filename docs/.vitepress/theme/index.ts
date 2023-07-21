import DefaultTheme from 'vitepress/theme';
import Icon from '../components/Icon.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp(ctx) {
    ctx.app.component('Icon', Icon);
  },
};
