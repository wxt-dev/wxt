# Editor Support

For better DX, you can configure your editor with plugins and extensions.

[[toc]]

## VS Code

Install the [I18n Ally Extension](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally) to:

- Go to translation definition
- Inline previews of text
- Hover to see other translations

You'll need to configure it the extension so it knows where your localization files are and what function represents getting a translation:

`.vscode/i18n-ally-custom-framework.yml`:

```yml
# An array of strings which contain Language Ids defined by VS Code
# You can check available language ids here: https://code.visualstudio.com/docs/languages/identifiers
languageIds:
  - typescript

# Look for t("...")
usageMatchRegex:
  - "[^\\w\\d]t\\(['\"`]({key})['\"`]"

# Disable other built-in i18n ally frameworks
monopoly: true
```

`.vscode/settings.json`:

```json
{
  "i18n-ally.localesPaths": ["src/locales"],
  "i18n-ally.keystyle": "nested"
}
```

## Zed

As of time of writing, Aug 18, 2024, no extensions exist for Zed to add I18n support.

## IntelliJ

Unknown - Someone who uses IntelliJ will have to open a PR for this!
