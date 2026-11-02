import DefaultTheme from 'vitepress/theme';
import Icon from '../components/Icon.vue';
import EntrypointPatterns from '../components/EntrypointPatterns.vue';
import UsingWxtSection from '../components/UsingWxtSection.vue';
import ExampleSearch from '../components/ExampleSearch.vue';
import BlogLayout from '../components/BlogLayout.vue';
import './custom.css';
import 'virtual:group-icons.css';
import { useData, type EnhanceAppContext } from 'vitepress/client';
import { setupCodeGroupSync } from '../utils/code-groups-sync';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';
import { h, nextTick, watch } from 'vue';

export default {
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    ctx.app
      .component('Icon', Icon)
      .component('EntrypointPatterns', EntrypointPatterns)
      .component('UsingWxtSection', UsingWxtSection)
      .component('ExampleSearch', ExampleSearch)
      .component('blog', BlogLayout);

    setupCodeGroupSync();
  },
  Layout: () => {
    const { isDark, localeIndex } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
      });
      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        downloadFormat: 'svg',
        fullscreenMode: 'browser',
        desktop: {
          copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        },
        fullscreen: {
          copyCode: 'disabled',
          toggleFullscreen: 'enabled',
          resetView: 'disabled',
          zoomLevel: 'disabled',
          download: 'enabled',
        },
      });
    };

    nextTick(() => initMermaid());

    watch(
      () => [isDark.value, localeIndex.value] as const,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
};
