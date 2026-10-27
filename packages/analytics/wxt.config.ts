import { defineConfig } from 'wxt';

export default defineConfig({
  // Unimport doesn't look for imports in node_modules, so when developing a
  // WXT module, we need to disable this to simplify the build process
  imports: false,

  manifest: {
    name: 'Analytics Demo',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAteYCATTmqODI1451FXJ0sIaPvhIniRidWqhwIxGpFLIxWlmYzPx2W7K7KXr+c41E4GxJPTgk3GVGfFoumeMy0zKgI8DFSdn5A3DTIdy72U2MBfuRq1Tp3Sjq8h78erawma7beMLq0rZjP7dhFVBsI5RwHqGctuupzBUa9Q4g7ANYCTULF20J5x+TQinNlU1HUzg5vOIObs/Ay3Mi7MiVwAoN38ea9xLzEfFrVaAUePAx1szI18wJsv6abZl+RHj5CK7ySM7R3hqJGpSmAvXEFIqhVUD0NtJxF+b9nR08GZUiADqD+Fr0YcNTzr+a5l5u47nRgZLnop7s3a41ssUHsQIDAQAB',
  },
  webExt: {
    chromiumPref: {
      'extensions.pinned_extensions': ['oamekmekgnhdjmindaokbbbedelebjbn'],
    },
  },
});
