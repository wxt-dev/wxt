---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
titleTemplate: 'Next Generation Web Extension Framework'

hero:
  name: WXT
  text: Next-gen Web Extension Framework
  tagline: Powered by Vite, inspired by Nuxt.
  image:
    src: /hero-logo.svg
    alt: WXT
  actions:
    - theme: brand
      text: Get Started
      link: /get-started/installation
    - theme: alt
      text: Learn More
      link: /get-started/introduction

features:
  - icon: 🌐
    title: Supported Browsers
    details: Chrome, Firefox, Edge, Safari, and any Chromium based browser.
  - icon: ✅
    title: MV2 and MV3
    details: Supports both manifest versions for each browser.
  - icon: ⚡
    title: Fast Dev Mode
    details: HMR for UIs and fast reload for background and content scripts.
  - icon: 📂
    title: File Based Entrypoints
    details: Manifest is generated based on files inside the project.
  - icon: 🚔
    title: TypeScript
    details: Scale projects with full TS support.
  - icon: 🦾
    title: Auto-imports
    details: Nuxt-like auto-imports to speed up development.
  - icon: ⬇️
    title: Bundle Remote Code
    details: Downloads and bundles remote code imported from URLs.
  - icon: 🎨
    title: Frontend Framework Agnostic
    details: Works with any front-end framework with a Vite plugin.
  - icon: 🖍️
    title: Bootstrap a New Project
    details: Comes with starter templates for all major frontend frameworks.
  - icon: 📏
    title: Bundle Analysis
    details: 'Tools for analyizing the final extension bundle.'
  - icon: 🤖
    title: Automated Publishing
    details: 'TODO: Automatically zip, upload, and release extensions.'
---

<ClientOnly>
  <UsingWxtSection />
</ClientOnly>
