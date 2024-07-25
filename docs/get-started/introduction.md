---
head:
  - - link
    - rel: canonical
      href: https://wxt.dev
---

# Introduction

## Overview

WXT is a free and open source framework for building web extensions in an conventional, intuitive, and safe way **_for all browsers_**.

WXT is based on [Nuxt](https://nuxt.com), and aims to provide the same great DX with TypeScript, auto-imports, and an opinionated project structure.

![Example build output](../assets/cli-output.png)

## Conventions

WXT is an opinionated framework. This helps keep projects consistent and easy to pick up.

- **Generated manifest**: Based on your project's file structure
- **Entrypoint configuration**: Configure entrypoints from the same file they're declare in
- **Type-safety is a priority**: Out-of-the-box TypeScript support with improved browser API typing
- **Simple output file structure**: Output file paths minimize the path at runtime

## Development

WXT's dev server supports modern features like HMR to provide a lighting fast dev mode.

When changes can't be hot-reloaded, like content scripts or background scripts, they're reloaded individually to prevent reloading the entire extension and slowing down your development cycle.

## Production-ready

Production builds are optimized for store review, changing as few files as possible between builds.

In addition, WXT fully supports Firefox's source code requirements when using a bundler. It will automatically create and upload a ZIP file of your source code.

:::info
See [Publishing](./publishing) for more info around production builds.
:::

## New to Extension Development?

Most of these docs assume you have a basic understanding of how to write a chrome or web extension.

If you've never written a web extension before or need a refresher, follow Google's ["Hello, World!" tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) to understand the basics.
