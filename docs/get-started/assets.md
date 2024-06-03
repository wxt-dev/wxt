# Assets

WXT has two directories for storing assets like CSS, images, or fonts.

- [public directory](/guide/directory-structure/public/): Store files that will be copied into the output directory as-is
- [assets directory](/guide/directory-structure/assets): Store files that will be processed by Vite during the build process

To learn more about how to use assets at runtime from either of these directories, visit their guides linked above.

## Public Directory

Place static files like the extension icon or `_locales/` directory here. These files will be copied over to the output directory without being transformed by Vite.

```
<srcDir>
└─ public/
   ├─ icon-16.png
   ├─ icon-32.png
   ├─ icon-48.png
   ├─ icon-96.png
   └─ icon-128.png
```

## Assets Directory

Files in the assets directory will be processed by Vite. They are imported in your source code, and will be transformed or renamed in the output directory.

```
<srcDir>
└─ assets/
   ├─ tailwind.css
   └─ illustration.svg
```
