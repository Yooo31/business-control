# BusinessControl

BusinessControl is a B2B SaaS foundation focused on long-term frontend maintainability. The repository starts with a clean Next.js 16 App Router setup, shadcn/ui primitives, an internal design system layer, strict quality tooling, and release automation.

## Stack

- Next.js 16
- pnpm
- TypeScript
- App Router
- Tailwind CSS v4
- shadcn/ui
- Vitest
- GitHub Actions
- semantic-release

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate
```

## Project shape

```text
src/
  app/                  Next.js routes, layouts and global styles
  components/
    ui/                 shadcn primitives and low-level UI building blocks
    shared/             reusable product-level composition blocks
  lib/
    design-system/      tokens and layout conventions
    site-config.ts      app metadata and global product config
  features/             future business domains
```

## Release flow

- CI runs on push and pull request.
- `semantic-release` publishes GitHub releases from `main`.
- Conventional Commits are expected for reliable automated versioning.

## Notes

- The skill `next-best-practices` was installed in `.agents/skills/next-best-practices`.
- Set `GITHUB_TOKEN` in GitHub Actions to enable automated releases.
