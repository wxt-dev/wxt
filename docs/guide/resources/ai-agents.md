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

## Docs for LLMs

WXT's documentation website provides markdown files based on the [/llms.txt proposal](https://llmstxt.org/):

- [`/llms.txt`](https://wxt.dev/llms.txt): An index of every page.
- `https://wxt.dev/<path>.md`: Any page as markdown. For example, <https://wxt.dev/guide/essentials/entrypoints.md>.
- [`/llms-full.txt`](https://wxt.dev/llms-full.txt): The entire site in a single file. It is very large (it includes the full API reference), so prefer fetching individual pages.

The website only serves docs for the **latest** version of WXT. If your project uses an older version, use the skill above, which reads docs from the matching git tag.

## Ask AI

There's an "Ask AI" button in the bottom right of every page, or visit <https://knowledge.wxt.dev/> for a fullscreen experience.

If you want to train your own model or provide context to your editor, you can use the LLM knowledge files hosted by the site: <https://wxt.dev/knowledge/index.json>
