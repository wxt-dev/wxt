---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: Next-gen Web Extension Framework

hero:
  name: WXT
  text: Next-gen Web Extension Framework
  tagline: An open source tool that makes Chrome Extension development faster than ever before.
  image:
    src: /hero-logo.svg
    alt: WXT
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: Learn More
      link: /guide/introduction

features:
  - icon: 🌐
    title: Supported Browsers
    details: WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.
    link: /guide/multiple-browsers
    linkText: Read docs
  - icon: ✅
    title: MV2 and MV3
    details: Build Manifest V2 or V3 extensions for any browser using the same codebase.
    link: /guide/multiple-browsers#target-manifest-version
    linkText: Read docs
  - icon: ⚡
    title: Fast Dev Mode
    details: Lighting fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.
    link: /guide/development.html
    linkText: Learn more
  - icon: 📂
    title: File Based Entrypoints
    details: Manifest is generated based on files in the project with inline configuration.
    link: /guide/entrypoints
    linkText: See project structure
  - icon: 🚔
    title: TypeScript
    details: Create large projects with confidence using TS by default.
  - icon: 🦾
    title: Auto-imports
    details: Nuxt-like auto-imports to speed up development.
    link: /guide/auto-imports
    linkText: Read docs
  - icon: 🤖
    title: Automated Publishing
    details: Automatically zip, upload, submit, and publish extensions.
  - icon: 🎨
    title: Frontend Framework Agnostic
    details: Works with any front-end framework with a Vite plugin.
    link: /guide/configuration#frontend-frameworks
    linkText: Add a framework
  - icon: 🖍️
    title: Bootstrap a New Project
    details: Get started quickly with several awesome project templates.
    link: /guide/installation#bootstrap-project
    linkText: See templates
  - icon: 📏
    title: Bundle Analysis
    details: Tools for analyzing the final extension bundle and minimizing your extension's size.
  - icon: ⬇️
    title: Bundle Remote Code
    details: Downloads and bundles remote code imported from URLs.
    link: /guide/remote-code
    linkText: Read docs
---

<section class="vp-doc" style="padding: 0 48px">
  <div class="container">
    <h2>Put <span style="color: var(--vp-c-brand-1)">Developer Experience</span> First</h2>
    <p>
      WXT's simplifies the chrome extension development process by providing tools for zipping and publishing, the best-in-class dev mode, an opinionated project structure, and more. Iterate faster, develop features not build scripts, and use everything the JS ecosystem has to offer.
    </p>
    <div style="margin: auto; width: 100%; max-width: 900px; text-align: center">
      <video src="https://github.com/wxt-dev/wxt/assets/10101283/4d678939-1bdb-495c-9c36-3aa281d84c94" controls></video>
      <br />
      <small>
        And who doesn't appreciate a beautiful CLI?
      </small>
    </div>
  </div>
</section>

<ClientOnly>
  <UsingWxtSection />
</ClientOnly>

<style scoped>
.container {
  margin: 0 auto;
  max-width: 1152px;
}
</style>
