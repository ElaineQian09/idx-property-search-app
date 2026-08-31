# Contributing

## Branch workflow

`main` is the stable branch. `develop` is the integration branch for completed work.

Create each change from an up-to-date `develop` branch:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-description
```

Open a pull request from the feature branch into `develop`. After validation and review,
merge it into `develop`. Release-ready changes can then move from `develop` to `main`.

Use `fix/short-description`, `docs/short-description`, or `chore/short-description`
when a prefix better describes the work.

## Before opening a pull request

Run the relevant checks locally:

```bash
cd backend && npm test
cd frontend && CI=true npm test -- --watchAll=false
```

Keep each commit focused on one logical change and use the commit format documented in
[docs/commit-conventions.md](docs/commit-conventions.md).
