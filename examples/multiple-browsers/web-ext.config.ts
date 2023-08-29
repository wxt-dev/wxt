/**
 * Normally, this file should be added to `.gitignore` since it only contains device-specific
 * configuration, like where binaries are installed.
 *
 * It is committed here as an example.
 */
import { defineRunnerConfig } from 'wxt';

// Change to the path to your chrome install
const chrome = '/Applications/Chrome.app/Contents/MacOS/Google Chrome';

export default defineRunnerConfig({
  binaries: {
    chrome,
    firefox: 'firefoxdeveloperedition',
    edge: chrome,
    opera: chrome,
    custom: chrome,
  },
});
