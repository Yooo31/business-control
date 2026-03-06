# AGENT.md

## Mission

Maintain BusinessControl as a pragmatic, scalable B2B SaaS frontend. Favor clarity, predictable patterns and small composable changes over clever abstractions.

## Core rules

- Keep the codebase simple. Add abstractions only after at least two real use cases.
- Preserve strict typing. Do not bypass types with `any`, broad assertions or silent fallbacks.
- Keep pages and layouts thin. Move reusable UI or business logic into shared components or feature modules.
- Prefer server components by default. Add client components only for interactivity, browser APIs or local UI state.
- Match existing naming, file placement and design-system conventions before introducing new patterns.

## Architecture target

- `src/app`: routing, layouts, metadata, loading and error boundaries.
- `src/components/ui`: low-level shadcn/ui primitives. Keep them generic and presentation-focused.
- `src/components/shared`: reusable composition blocks shared across routes or features.
- `src/features`: domain-oriented modules such as listings, audits, locations, settings.
- `src/lib/design-system`: tokens, layout rules and other design primitives.
- `src/lib`: cross-cutting utilities and app-wide configuration.

## Naming

- Use `PascalCase` for React component files and exported React components only when the file is a single component entry. Use `kebab-case` for utility and config files.
- Use descriptive names tied to the domain or UI purpose. Avoid vague names like `helper`, `manager`, `stuff`, `data`.
- Keep component props explicit. Prefer small prop surfaces over “options bags”.

## React and Next.js

- Default to async server components for data-driven routes.
- Use client components only behind a clear boundary.
- Co-locate route-specific code under the route when it will not be reused.
- Do not fetch inside low-level UI primitives.
- Use `next/font`, typed metadata and typed routes consistently.
- Avoid premature `useMemo` and `useCallback`. Add them only when profiling or API semantics justify them.

## Design system usage

- Reuse tokens from `src/lib/design-system` before inventing new spacing, radii, shadows or layout patterns.
- Keep semantic colors meaningful: primary, muted, accent, success, warning, destructive.
- Build new low-level primitives in `components/ui` only when they are generic enough to be reused.
- Build product-specific composition blocks in `components/shared` or a feature module, not in `components/ui`.
- When extending shadcn components, preserve accessibility and variant consistency.

## Component creation

- Start from the smallest useful abstraction.
- Keep one concern per component.
- Accept `className` when composition is expected.
- Prefer composition over prop explosion.
- Add comments only when the intent is not obvious from the code.

## Features and pages

- Future feature code should follow `src/features/<feature-name>/` with subfolders only when needed, such as `components`, `server`, `schemas`, `lib`.
- Avoid cross-feature imports when a dependency belongs in `src/lib` or `src/components/shared`.
- Keep route files focused on orchestration: fetch data, assemble sections, export metadata.

## Quality bar

- Run `pnpm validate` before finishing substantial changes.
- Keep ESLint and TypeScript clean with no ignored warnings unless there is a documented reason.
- Add or update tests when changing reusable logic.
- Do not weaken CI, release automation or lint rules without a concrete justification.

## Avoid

- No `any`.
- No dead files, demo assets or unused dependencies.
- No duplicated layout primitives when an existing shared block already fits.
- No feature logic inside `components/ui`.
- No hidden side effects in utility helpers.
