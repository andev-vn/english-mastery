# English Mastery — guidance for AI assistants

Mobile-first PWA for Vietnamese learners of English (CEFR A1–C2). Read `docs/ARCHITECTURE.md` before larger changes.

## Stack (use these versions' APIs — do not fall back to older patterns)

- React 19 function components + hooks. No class components, no `React.FC`, no default `React` import.
- TypeScript 6, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` → use `import type` for types. No `any`.
- Vite 8, Tailwind CSS v4 (CSS-first config in `src/styles/index.css` via `@theme`; there is **no** `tailwind.config.js`).
- React Router 8 **data router** (`createBrowserRouter`, route `lazy`), imported from `react-router` (not `react-router-dom`).
- TanStack Query v5 (object syntax, `isPending`), Zustand v5 (`create<T>()(...)`), Zod v4, React Hook Form 7.
- Vitest 5 + Testing Library, Playwright for E2E. ESLint 10 flat config with `react-hooks` v7 (compiler purity rules).

## Rules

- Mobile first: design for 360 px, then widen. Touch targets ≥ 44 px. No horizontal overflow.
- Colors only through design tokens (`bg-primary`, `text-text-muted`, …). Never hard-code hex in components.
- Presentation components never import data files or (later) Supabase directly — go through
  `src/services/*` (repository + query hooks).
- Learning content lives in `src/data/*` (later Postgres), never inline in UI code. Vietnamese explanations are required.
- XP is only for meaningful learning (see `src/lib/xp.ts`). Do not add XP for repeated/no-op actions.
- No impure calls during render (`Date.now()`, `Math.random()`); use effects, handlers or `src/lib/date.ts` helpers.
- AI features are optional and must go through a server-side function; never put provider keys in `VITE_*` vars.
- Never claim something works without running it.

## Commands

```
npm run dev         # dev server
npm run typecheck   # tsc -b
npm run lint
npm test            # vitest
npm run test:e2e    # playwright (builds + previews production)
npm run build
```
