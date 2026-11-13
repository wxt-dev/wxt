<script lang="ts" setup>
import UsingWxtSection from '../UsingWxtSection.vue';
import HomeBento from './HomeBento.vue';
import HomeBrowsers from './HomeBrowsers.vue';
import HomeCta from './HomeCta.vue';
import HomeEntrypoints from './HomeEntrypoints.vue';
import HomeHero from './HomeHero.vue';
import HomeSectionHead from './HomeSectionHead.vue';
import HomeWorkflow from './HomeWorkflow.vue';
</script>

<template>
  <div class="home-page">
    <HomeHero />

    <div class="sections">
      <HomeWorkflow class="section" />
      <HomeEntrypoints class="section" />
      <HomeBrowsers class="section" />
      <HomeBento class="section" />

      <section class="section">
        <HomeSectionHead count="01" title="Who's using WXT?">
          Battle tested and ready for production. Explore web extensions made
          with WXT.
        </HomeSectionHead>
        <ClientOnly>
          <UsingWxtSection :limit="12" />
        </ClientOnly>
      </section>

      <HomeCta class="section" />

      <section class="section sponsors">
        <HomeSectionHead title="Sponsors" center>
          WXT is a
          <a
            class="no-icon"
            href="https://github.com/wxt-dev/wxt/blob/main/LICENSE"
            >MIT-licensed</a
          >
          open source project with its ongoing development made possible
          entirely by the support of these awesome backers. If you'd like to
          join them, please consider
          <a class="no-icon" href="https://github.com/sponsors/wxt-dev"
            >sponsoring WXT's development</a
          >.
        </HomeSectionHead>
        <a class="no-icon" href="https://github.com/sponsors/wxt-dev"
          ><img
            alt="WXT Sponsors"
            src="https://raw.githubusercontent.com/wxt-dev/static/refs/heads/main/sponsorkit/sponsors-wide.svg"
        /></a>
      </section>
    </div>
  </div>
</template>

<!-- Page level overrides for VitePress's home layout. -->
<style>
.VPContent.wxt-home .VPHome {
  margin-bottom: 0;
}
/* Let the page use the full width instead of VitePress's centered container. */
.VPContent.wxt-home .VPHome .vp-doc.container {
  max-width: none;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.home-page {
  --wxt-home-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  text-align: left;
}

.sections {
  max-width: 1152px;
  margin: 0 auto;
}
.section {
  padding: 88px 24px;
}
.section + .section {
  border-top: 1px solid var(--vp-c-divider);
}

.sponsors {
  text-align: center;
}
.sponsors :deep(.sub) {
  max-width: 720px;
  font-size: 15px;
}
.sponsors :deep(.sub a) {
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
  color: var(--vp-c-brand-1);
}
.sponsors img {
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .section {
    padding: 56px 16px;
  }
}
</style>
