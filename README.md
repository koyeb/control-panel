[Website](https://www.koyeb.com) |
[Twitter](https://twitter.com/gokoyeb) |
[Repository](https://github.com/koyeb/console.koyeb.com)

![](https://github.com/koyeb/console.koyeb.com/workflows/CI/badge.svg)

# Overview

This project contains the source code of the Koyeb control panel, accessible at [https://app.koyeb.com](https://app.koyeb.com).

> Also known as the "console", but we prefer saying control panel to avoid confusion with the web shell
> feature.

## Introduction

The control panel is a [React](https://reactjs.org) project powered by [TypeScript](https://typescriptlang.org),
[Next.js](https://nextjs.org), [Material-UI](https:/material-ui.com) and [tailwindcss](https://tailwindcss.com).

If this documentation is unclear or outdated, feel free to [open a pull request](https://github.com/koyeb/console.koyeb.com/pulls)
on the GitHub repository.

## Getting started

To bootstrap a development environment, you need:

- [Node.js](https://nodejs.org), a JavaScript runtime environment (version 18)
- [pnpm](https://pnpm.io), a package manager for Node.js

To easily install and use specific versions of Node.js, we recommend using [Node Version Manager](https://github.com/nvm-sh/nvm).

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

Check out their readme for more information.

Once `nvm` is installed on your system, you can install Node.js 18 with `nvm install 18`. After that, you
should have the `node` binary in your `$PATH`.

```sh
node --version
v18.17.0
```

`pnpm` can be installed with Node.js's [corepack](https://nodejs.org/docs/latest-v18.x/api/corepack.html) API.
It's still experimental, but stable enough and safe to use for our use case.

```sh
corepack prepare pnpm@latest --activate
```

You should now be able to install the control panel's dependencies.

```sh
pnpm install --recursive
```

The project is split into multiple packages that must be built before you can start working on the codebase.
This is done using `tsc`, the TypeScript compiler.

```sh
pnpm exec tsc --build
```

The global setup is now ready. If any of these steps produced unexpected results, let us know on our primary
communication channel so we can help you and update this docs accordingly.

To start the Next.js app, head to the the webapp package's [getting started](./packages/webapp/README.md#getting-started)
and continue from there.

## Packages

The control panel is split across different packages, each of them serving a specific purpose. Here is an
overview of what they do, and a link to their dedicated documentation.

- [@koyeb/api](./packages/api): API calls and transformations between the Koyeb API and the control panel data models
- [@koyeb/api-sdk](./packages/api-sdk): Generated API SDK from the OpenAPI definition using openapi-typescript-codegen
- [@koyeb/design-system](./packages/design-system): Theme, base components and design guidelines
- @koyeb/features: Implementation of the control panel's features
- [@koyeb/model](./packages/model): The control panel's data model definition
- [@koyeb/utils](./packages/utils): Helper functions shared across all packages
- [@koyeb/webapp](./packages/webapp): Next.js app running the Koyeb control panel

These packages are linked together using TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html),
allowing to isolate contextes, improve integration with IDE and speed up the build time.

When working on the codebase, it's best to build the projects when a change saved, by starting TypeScript in
watch mode. To do so, run `pnpm exec tsc --build --watch` from the repository's root directory. This process
can also be integrated with [Visual Studio Code](https://code.visualstudio.com) by starting the default build
[task](https://code.visualstudio.com/docs/editor/tasks).

> These `@koyeb/X` packages are not published, they only make sense within this repository.

## Code style / formatting

We use [eslint](https://eslint.org) to perform some static analysis, and [prettier](https://prettier.io) to
make sure the formatting stays consistent.

These tools are pretty commonly used, so there should be a way to integrate them with your favorite editor.
For vscode, install the [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
and [esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
extensions.

> Note that some people like to integrate prettier through eslint, but this is not how we do it here. These
> tools are both working independently.

## Translations

We use [React Intl](https://formatjs.io/docs/react-intl) for internationalization, with the help of an [eslint plugin](https://formatjs.io/docs/tooling/linter/)
to generate ids for every translation across the codebase. If you have correctly setup eslint to work with
your IDE, it should update these ids automatically.

When building the `@koyeb/webapp` package, the translations file will be updated automatically, by extracting
the translation strings from the source files. This file must be updated and committed to the repository.

## Tests

Unit and integration tests are written using [vitest](vitest.dev) as a test runner and assertion library. To
run them, launch `pnpm test` from the package you want. Not all packages have tests, though.

The logic tied to React components and hooks is tested using [React Testing Library](https://testing-library.com),
a set of tools to help writing maintainable tests for a Web UI.

We mainly write tests to make sure that the business rules are respected, in order to avoid regressions when
changing the code and deliver with confidence. This means that not all the code should be tested: for example
a component that only displays data without any logic do not need tests.

There use to be end-to-end tests, to assert that the happy path of the main features were functioning
as expected. Unfortunately, we didn't invest time to maintain these tests, but we plan to make them work again
at some point.

## Storybook

We use [storybook](https://storybook.js.org) to work on components in an isolated context, making it possible
to develop part of the control panel without the load of the full Next.js app.

Refer to their documentation for more information about what it is and how it can be used.

## Inversion of control

The inversion of control (IoC) pattern is widely used across the codebase. The features do not depend on
frameworks directly, but they depend on abstractions. To implement this pattern, we use
[brandi](brandi.js.org) as a dependency injection library.

By framework, we refer to things that are not part of the main business logic: routing, API calls, tracking,
error reporting, browser's built-ins like `Date` or `setTimeout` and so on.

This pattern brings several benefits:

- The domain code is decoupled from the frameworks
- We can easily change a framework or library with another
- Writing tests for the business logic do not require mocking out frameworks
- Writing stories is much easier

## CI / CD

Some workflows are run through [GitHub Actions](https://github.com/features/actions):

- Build docker image (master and develop branches only): builds and pushes a docker image that will be
  deployed on staging and production
- Deploy preview env (PR only): creates a deployment on Koyeb targeting the branch of the pull request
- Code quality: check linter, formatter, types and tests

Once the docker image is pushed, the deployment is handled by flux on our infrastructure.

## Submitting pull requests

The project welcomes all contributions regardless of skill or experience level. If you are interested in
helping with the project, we will help you with your contribution.

## Git branches and merges

We try to keep a linear history on this repository, meaning that all commits happened on a single timeline
(without "merge commits"). This is possible without effort because there is manly one developer committing to
this repository at this time, but it may change in the future when the team will grow.

We use the branches:

- `master`: production branch
- `develop`: staging branch
- anything else: feature branches

All feature branches must target `develop`. When a branch is related to a linear issue, it should use the
name suggested by linear, to link the pull request automatically.

Merging a branch must be done locally, because [github doesn't support fast-forward merge](https://stackoverflow.com/questions/60597400/how-to-do-a-fast-forward-merge-on-github).
To merge a pull request, make sure it's up to date with develop, and from develop run `git merge --ff-only <branch>`.
Then you can push `develop`, which will mark the pull request as merged, trigger the build of the docker image
and the deployment in staging.

Similarly, to deploy to production, checkout `master` and run `git merge --ff-only develop`. Then just push
`master` and the new commits will be deployed in production automatically.

Warning: to push a branch feature that was rebased locally, you will need to use `--force` (or
`--force-with-lease` which should be preferred). This must never be done on `develop` and `master`.
