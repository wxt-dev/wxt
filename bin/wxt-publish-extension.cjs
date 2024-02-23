#!/usr/bin/env node
/**
 * A alias around `publish-extension` that is always installed on the path without having to install
 * `publish-browser-extension` as a direct dependency (like for PNPM, which doesn't link
 * sub-dependency binaries to "node_modules/.bin")
 */
require('publish-browser-extension/cli');
