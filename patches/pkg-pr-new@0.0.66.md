Bun outputs packed tarballs relative to the workspace root when using `--filename`. So we need to use an absolute patht make sure the file is output where pkg-pr-new expects it to be - in the package's directory.

`p3` is equal to: '/home/runner/work/wxt/wxt/packages/analytics/'

This has been fixed in <https://github.com/stackblitz-labs/pkg.pr.new/pull/483>, but is not released as of `0.66.0`.

Once v0.67.0 is released, we can revert back to using bunx, delete this patch, and remove the local dependency in `<root>/package.json`.
