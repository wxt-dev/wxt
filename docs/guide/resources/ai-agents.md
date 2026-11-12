# AI Agents

WXT ships a skill with the `wxt` NPM package and publishes docs in formats that are easy for LLMs to read.

## WXT Skill

The `wxt` package includes an [agent skill](https://agentskills.io) called `wxt-docs`. It teaches your agent how to find documentation that matches the **exact version of WXT your project uses**, instead of relying on the latest docs or outdated training data.

The skill lives in `node_modules/wxt/skills/wxt-docs/`. Your agent won't see it there, so you have to link it into your project's agent skill directories (`.claude/skills`, `.agents/skills`, etc.) with one of the tools below.

### PNPM

PNPM [supports skills natively](https://pnpm.io/agent-skills) (v12.11.0+). After installing, approve WXT's skills:

```sh
pnpm approve
```

PNPM links approved skills into the agent skill directories that already exist in your workspace root.

### NPM, Bun, and Yarn

Use the [`skills` CLI](https://github.com/vercel-labs/skills) from Vercel to sync skills shipped by your dependencies:

```sh
npx skills experimental_sync
```

> [!WARNING]
> `experimental_sync` is a preview command. Its name and options may change in future releases of `skills`. See the [`skills` docs](https://github.com/vercel-labs/skills#experimental-features) for the latest usage.

### TanStack Intent

[`@tanstack/intent`](https://tanstack.com/intent/latest/docs/overview) discovers skills in your installed dependencies and works with npm, pnpm, Bun, and Yarn. It is currently in alpha.

```sh
# List skills found in your dependencies
npx @tanstack/intent@latest list

# Add skill-loading guidance to AGENTS.md, CLAUDE.md, etc.
npx @tanstack/intent@latest install
```

Instead of linking skills into agent directories, `install` writes guidance into your agent config files telling your agent how to load skills from `node_modules`.

## Download Docs Locally

[`wxt docs`](/api/cli/wxt-docs) downloads the documenation for your installed WXT version:

```sh
wxt docs
```

Docs are written to `.wxt/docs/v<version>/` (for example `.wxt/docs/v0.21.5/`).

```sh
# Custom base directory → tmp/wxt-docs/v<version>/
wxt docs --out-dir tmp/wxt-docs

# Redownload after upgrading WXT
wxt docs --force
```

Point your project's `AGENTS.md` (or similar) at those files. Update the path when you upgrade WXT:

```md
See @.wxt/docs/v<version>/guide/essentials/entrypoints.md
```

The [wxt-docs skill](#wxt-skill) prefers this local tree when it exists. Otherwise it fetches docs from the matching git tag.

## Docs for LLMs

WXT's documentation website provides markdown files based on the [/llms.txt proposal](https://llmstxt.org/):

- [`/llms.txt`](https://wxt.dev/llms.txt): An index of every page.
- `https://wxt.dev/<path>.md`: Any page as markdown. For example, <https://wxt.dev/guide/essentials/entrypoints.md>.
- [`/llms-full.txt`](https://wxt.dev/llms-full.txt): The entire site in a single file. It is very large (it includes the full API reference), so prefer fetching individual pages.

The website only serves the **latest** WXT docs.

If your project is on an older version, use the [skill](#wxt-skill). [`wxt docs`](#download-docs-locally) is only available in newer releases, and it always downloads docs for the version you have installed.

## Context7

[Context7](https://context7.com) is an MCP server that gives your agent up-to-date library docs. WXT is indexed as [`/wxt-dev/wxt`](https://context7.com/wxt-dev/wxt). If you have the Context7 MCP server installed, reference the library ID in your prompt so your agent doesn't pick one of the other WXT entries:

```text
Create a content script that mounts a Vue UI. use library /wxt-dev/wxt
```

> [!NOTE]
> Context7 serves the latest docs, so it may not match older versions of WXT. Use the [WXT skill](#wxt-skill) if your project is not on the latest version.

## DeepWiki

[DeepWiki](https://deepwiki.com/wxt-dev/wxt) provides an AI-generated wiki and Q&A for WXT's repository. It's most useful for understanding how WXT works internally, like the build pipeline or module system.

You can browse it on the website, or connect your agent to the [DeepWiki MCP server](https://docs.devin.ai/work-with-devin/deepwiki-mcp):

```text
https://mcp.deepwiki.com/mcp
```

> [!NOTE]
> DeepWiki's answers are generated, so verify them against the docs or source code.

## Ask AI

There's an "Ask AI" button in the bottom right of every page, or visit <https://knowledge.wxt.dev/> for a fullscreen experience.

If you want to train your own model or provide context to your editor, you can use the LLM knowledge files hosted by the site: <https://wxt.dev/knowledge/index.json>
