Bun outputs packed tarballs relative to the workspace root when using `--filename`. So we need to use an absolute patht make sure the file is output where pkg-pr-new expects it to be - in the package's directory.

`p3` is equal to: '/home/runner/work/wxt/wxt/packages/analytics/'
