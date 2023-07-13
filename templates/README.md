# WXT Templates

To add or change a template, open the template's folder (`template/<name>`) in your editor directly. Then, it's a normal NPM project.

Note that you should use `npm` instead of `pnpm` in the template directories so that it doesn't complict with the repo's PNPM workspace. Templates are standalone and should not depend on the local state of `wxt`.
