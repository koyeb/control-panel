# CI / CD

The project uses [GitHub Actions](https://github.com/features/actions) for continuous integration and deployment. There are four workflows, a shared setup action, and a Docker-based deployment pipeline. There are no pre-commit hooks — quality gates run entirely in CI, and all jobs run in parallel to keep CI as fast as possible.

## Workflows

**Code quality** — Triggered on **every push**, checks types, linting, formatting, spelling mistakes and runs unit tests.
**Build docker image** — Triggered on **push to `production` or `staging`**, and pushes the image to GCR (where it's deployed automatically).
**E2E tests** — **Manual trigger only**, runs Playwright tests inside the official Playwright container (`mcr.microsoft.com/playwright`).
**One-click apps** — **Manual trigger only**, deploys every one-click app template and waits for healthy status.

## Setup action

All workflows share `.github/actions/setup/action.yaml`, a composite action that:

1. Installs pnpm (via `pnpm/action-setup@v4`)
2. Installs Node.js 20 with pnpm store caching (via `actions/setup-node@v4`)
3. Runs `pnpm install --frozen-lockfile --strict-peer-dependencies`

## Secrets and variables

Environment variables are stored in different places depending on the target:

- **Production** — GitHub repository variables and secrets (used by the build workflow)
- **Staging** — configured directly in the Koyeb service settings

The build workflow passes these as Docker build args, baked into the static bundle at build time.

## Deployment flow

The project maintains a linear git history with three long-lived branches:

- **`master`** — base branch, target for all feature branches
- **`staging`** — deployed to the staging environment (hosted on Koyeb, internal access only)
- **`production`** — deployed to the production environment (hosted on Koyeb's infrastructure)

Feature branches are merged into `master` locally with `git merge --ff-only` (GitHub doesn't support fast-forward merges natively). Make sure the CI passes before merging a pull request. To deploy, move `staging` or `production` to the desired commit and push:

```sh
git checkout staging
git merge --ff-only master
git push
```

> **Note**: The `staging` and `production` branches are used as pointers, they can be changed to any commit with `git branch -f`.

## Preview environments

Branches can be deployed on Koyeb. To do so, duplicate the `console-staging/console-staging` service and change its branch in the settings. Use the `console-production/console-production` service to deploy an environment targeting the production API.
