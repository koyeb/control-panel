[Website](https://www.koyeb.com) | [Repository](https://github.com/koyeb/control-panel)

[![Code quality](https://github.com/koyeb/control-panel/actions/workflows/code_quality.yml/badge.svg)](https://github.com/koyeb/control-panel/actions/workflows/code_quality.yml)

# Overview

This project contains the source code of the Koyeb control panel, accessible at [https://app.koyeb.com](https://app.koyeb.com).

## Introduction

The control panel is a [React](https://reactjs.org) project powered by [TypeScript](https://typescriptlang.org), [Vite](https://vitejs.dev) and [tailwindcss](https://tailwindcss.com).

If this documentation is unclear or outdated, feel free to [open a pull request](https://github.com/koyeb/control-panel/pulls) on the GitHub repository.

## Run the project locally

To bootstrap a development environment, you need:

- [Node.js](https://nodejs.org), a JavaScript runtime
- [pnpm](https://pnpm.io), a package manager for Node.js

To easily install and use specific versions of Node.js, we recommend using [Node Version Manager](https://github.com/nvm-sh/nvm).

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Check out their readme for more information.

Once `nvm` is installed on your system, you can install Node.js with `nvm install --lts`. After that, you should have the `node` binary in your `$PATH`.

```sh
node --version
v20.17.0
```

`pnpm` can be installed with Node.js's [corepack](https://nodejs.org/docs/latest-v20.x/api/corepack.html) API. It's still experimental, but stable enough and safe to use for our use case.

```sh
corepack enable
```

You should now be able to install the control panel's dependencies.

```sh
pnpm install
```

The global setup is now complete. If any of these steps produced unexpected results, let us know on our primary communication channel so we can help you and update this docs accordingly.

To start the app's development server, simply run `pnpm run dev`.

## Design System

To accelerate the development of features and ensure that the look and feel of the control panel stays consistent, we use a set of building blocks: a theme, a set of base react components and some styling guidelines.

The code of this design system is in the [design-system](./design-system) folder. The theme is defined in the [tailwind preset](./design-system/tailwind-preset.ts) file, and the components are all exported in [a barrel export](./design-system/src/index.ts).

To run commands within this package, make sure to install the dependencies first.

```
cd design-system && pnpm install
```

## Code style / formatting

[ESlint](https://eslint.org) is used to perform some static analysis, and [prettier](https://prettier.io) to make sure the code formatting stays consistent.

These tools are pretty commonly used, so there should be a way to integrate them with your favorite editor. For [Visual Studio Code](https://code.visualstudio.com), install the [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions.

> Some people like to run prettier through eslint, but this is not how we do it. These tools are both working independently.

## Tests

Part of the code is unit-tested using [vitest](vitest.dev) as a test runner and assertion library. To run the test suites, run `pnpm test`.

The logic tied to React components and hooks is tested using [React Testing Library](https://testing-library.com), a set of tools to help writing maintainable tests for a Web UI.

We mainly write tests to make sure that the business rules are respected, in order to avoid regressions when changing the code and deliver with confidence. This means that not all the code should be tested: for example a component that only displays data without any logic do not need tests.

The critical paths of the main features are tested with end-to-end tests. These tests are implemented with [playwright](https://playwright.dev) and can be started with `pnpm e2e`.

## Storybook

We use [storybook](https://storybook.js.org) to work on components in an isolated context. Refer to their documentation for more information about what it is and how it can be used.

## CI / CD

Some workflows are run through [GitHub Actions](https://github.com/features/actions):

- Build docker image (production and staging branches only): build and push a docker image that will be deployed automatically
- Code quality: check linter, formatter, types and tests
- E2E tests (manual trigger): run the end-to-end tests
- Preview env (PR only): creates a deployment on Koyeb with the code of the pull request
- Publish design system (manual trigger): publish the design system in a github npm package

## Submitting pull requests

The project welcomes all contributions regardless of skill or experience level. If you are interested in helping with the project, we will help you to get started, don't hesitate to reach out.

## Git branches and merges

We try to keep a linear history on this repository, meaning that all commits happened on a single timeline (without "merge commits"). This is possible without effort because there is manly one developer committing to this repository at this time, but it may change in the future when the team will grow.

We use the branches:

- `master`: base branch
- `production`: branch deployed in production
- `staging`: branch deployed in staging
- everything else: feature branches

All feature branches must target `master`. When a branch is related to a linear issue, it should use the name suggested by linear, to link the pull request automatically.

Merging a branch must be done locally, because [github doesn't support fast-forward merge](https://stackoverflow.com/questions/60597400/how-to-do-a-fast-forward-merge-on-github). To merge a pull request, make sure it's up to date with master and run `git merge --ff-only <branch>`. Then you can push `master`, which will mark the pull request as merged.

To deploy in staging or production, just move the corresponding branch to what you want to be deployed, and push it. Everything else will be handled automatically.

Warning: to push a branch feature that was rebased locally, you will need to use `--force` (or `--force-with-lease` which should be preferred).

## More docs

Some documentations about specific topics are also available:

- [Github app install flow](./docs/github-app.md)
- [Github authentication flow](./docs/github-oauth.md)
- [Single sign-on](./docs/sso.md)
- [Styles](./styles.md)
