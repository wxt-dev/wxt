<script lang="ts" setup>
const extensions = [
  {
    name: 'GitHub: Better Line Counts',
    description: 'Remove generated files from GitHub line counts.',
    icon: 'https://lh3.googleusercontent.com/GcffNyCJaxT2G9dsQCJHhUEMlu_E0vEzph5cLPrQj7UHKat7QyCzGu69Dmp_DDUL8rY-bPMFJceQarS1wcqdwTalTg=s256',
    link: 'https://chrome.google.com/webstore/detail/github-better-line-counts/ocfdgncpifmegplaglcnglhioflaimkd',
  },
];
</script>

<template>
  <section class="vp-doc">
    <div class="container">
      <h2>Who's Using WXT?</h2>
      <ul>
        <li v-for="extension of extensions">
          <img :src="extension.icon" :alt="`${extension.name} icon`" />
          <a :href="extension.link" target="_blank">{{ extension.name }}</a>
          <small>{{ extension.description }}</small>
        </li>
      </ul>
      <p>Open a PR to add your extension to the list!</p>
    </div>
  </section>
</template>

<style scoped>
.vp-doc {
  padding: 0 24px;
}

h2 {
  margin-bottom: 32px;
}

@media (min-width: 640px) {
  .vp-doc {
    padding: 0 48px;
  }
}

@media (min-width: 960px) {
  .vp-doc {
    padding: 0 64px;
  }
}

.container {
  max-width: 1152px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

img {
  width: 96px;
  height: 96px;
  margin-bottom: 16px;
}

ul {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: stretch;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}
@media (min-width: 640px) {
  ul {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 960px) {
  ul {
    grid-template-columns: repeat(4, 1fr);
  }
}

li {
  margin: 0 !important;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  flex: 1;
}
a,
small {
  text-align: center;
}
small {
  opacity: 50%;
}

p {
  text-align: center;
  opacity: 50%;
}
a {
  color: var(--vp-c-text-1);
  cursor: pointer;
}
</style>
