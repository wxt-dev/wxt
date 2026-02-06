# Maintainers

A couple of things for you to consider before merging a PR or giving the go-ahead on a feature proposal.

## Be picky about new features and packages

We are responsible for maintaining them and fixing related bugs after the PR is merged. The community can always release their own WXT modules or packages, not everything needs to be built into WXT.

## Prefer standards over customization

Don't merge PRs that just add another way to do something, like [this one](https://github.com/wxt-dev/wxt/pull/2053#issuecomment-3857010196).

WXT is opinionated, if you have questions about what is WXT's opinion or we need to create a new one, create an issue and @ me to discuss.

## PRs should be small and targetted

A PR should make one change. They should not make any unrelated changes outside of accomplishing the one thing. This makes PRs easier to review and they get merged more quickly - a win-win for everyone.

## `@wxt-dev/*` packages are separate

We can't make changes to these packages assuming people are using them only with WXT. For example, I almost missed [this PR](https://github.com/wxt-dev/wxt/pull/2049#issuecomment-3861251599).

I want these packages to be usable on their own so if people don't like WXT's build tool, they can still use our other awesome packages.

## Minimize dependencies

I don't like how heavy lots of frameworks are. It's unavoidable to a certain extent, but if you can do something without another dependency, try to.

If you need a dependency, look for one with zero dependencies and that's respectable.

## Look at milestones

I've organized WXT's long term plans into [milestones](https://github.com/wxt-dev/wxt/milestones), check those out to get an idea of my priorities for some of the larger features.

## Require tests

If someone opens a PR to fix a bug but doesn't include tests, don't merge the PR. Tests are required to prevent regressions and maintain a codebase long term.

## Ask for reproductions for bugs

You don't need to triage bugs if someone doesn't give you enough information. You can always ask for a repo with a reproduction or wait for more details.

If there's not an easy way to reproduce a bug, you're wasting your time triaging it. Just be mindful of your own time!

## Add yourself as a code owner

If you want to be responsible for a specific package or directory, add yourself to the [`.github/CODEOWNERS`](https://github.com/wxt-dev/wxt/blob/main/.github/CODEOWNERS) file to get added as a reviewer to PRs automatically. You can also add yourself to the default list to be added as a reviewer on all PRs.
