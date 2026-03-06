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
pnpm db:generate
pnpm db:push
pnpm db:migrate:deploy
pnpm db:check
pnpm db:studio
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate
```

## Supabase + Prisma setup

1. Create a new Supabase project from the Supabase dashboard.
2. In `Project Settings` -> `Database`, copy the direct Postgres connection string.
3. Set `DATABASE_URL` in `.env` with the direct connection string on port `5432` and keep `?schema=public&sslmode=require`.
4. Generate the client with `pnpm db:generate`.
5. Apply the initial migration with `pnpm db:migrate:deploy`.
6. Validate access with `pnpm db:check`.
7. Open Prisma Studio with `pnpm db:studio`.

The repository already contains the first SQL migration in `prisma/migrations`.

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
