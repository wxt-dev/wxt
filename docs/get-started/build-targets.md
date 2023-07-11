# Build Targets

You can build an extension for any combination of browser and manifest verison. Different browsers and manifest versions support different APIs and entrypoints, so be sure to check that your extension functions as expected for each target.

Separate build targets are to separate output directories:

```
<root>
└─ .output
   ├─ chrome-mv3
   ├─ firefox-mv2
   ├─ edge-mv3
   └─ ...
```

## Target Browser

To build for a specific browser, pass the `-b --browser` flag from the CLI:

```

wxt --browser firefox
wxt build --browser firefox

```

By default, it will build for `chrome`. When excluding the [`--mv2` or `--mv3` flags](#target-manifest-version), it will default to the commonly accepted version used with that browser.

| Browser          | Default Manifest Version |
| ---------------- | :----------------------: |
| `chrome`         |            3             |
| `firefox`        |            2             |
| `safari`         |            2             |
| `edge`           |            3             |
| Any other string |            3             |

## Target Manifest Version

To build for a specific manifest version, pass either the `--mv2` flag or `--mv3` flag from the CLI.

```sh
wxt --mv2
wxt build --mv2
```

When the `-b --browser` flag is not passed, it defaults to `chrome`. So here, we're targetting MV2 for Chrome.
