# Design system

Defined in `src/styles/index.css`. Raw values are CSS variables (`--em-*`) on `:root`; Tailwind v4 maps them to
utilities through `@theme inline`, so `bg-primary`, `text-text-muted`, etc. switch automatically with the theme.

## Color tokens

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `primary` | #5969E8 | #7C89F0 | Main actions, active nav, progress |
| `primary-soft` | #ECEEFD | #262B4D | Selected backgrounds, chips |
| `secondary` | #16B8A6 | #2FCFBC | Vocabulary / review accents |
| `bg` | #F6F7FB | #10121C | Page background |
| `surface` | #FFFFFF | #191C29 | Cards, sheets |
| `surface-muted` | #EFF1F7 | #222636 | Tracks, inset areas |
| `border` | #E3E6EF | #2C3144 | Dividers, outlines |
| `text` | #20243A | #ECEEF6 | Primary text |
| `text-subtle` | #5D6479 | #B1B7C9 | Body copy |
| `text-muted` | #8A91A5 | #8A91A5 | Secondary text |
| `success` | #20B486 | #3BCB9C | Correct answers, goals reached |
| `warning` | #F3A847 | #F5B766 | Streaks, in-progress, achievements |
| `danger` | #E65C68 | #F07883 | Errors, wrong answers |

Each semantic color also has a `*-soft` background variant.

Theme: `<html data-theme="light|dark">`, set by `app/ThemeSync.tsx` (light default; "system" follows the OS).
An inline script in `index.html` applies the stored theme before first paint.

## Typography

Inter Variable, self-hosted, only Latin + Latin-ext + Vietnamese subsets (`src/styles/fonts.css`).
Scale: page title 22–26 px bold · section 17 px bold · body 15 px · meta 12–14 px.

## Spacing, radius, elevation

4 px grid (Tailwind). Page gutter 16 px on mobile, 24 px ≥ sm, 40 px ≥ lg.
Radius: cards `rounded-card` (20 px), controls `rounded-2xl` (16 px). Shadows: `shadow-card` (subtle), `shadow-raised` (sheets, toasts).

## Layout

- Mobile: fixed bottom navigation (5 items, 64 px + safe area). Content max width 768 px.
- Desktop (≥ 1024 px): left navigation rail; bottom navigation hidden.
- Focus mode (lessons, exercises, flashcards): no navigation, sticky bottom action.
- Safe areas: `env(safe-area-inset-*)` on top padding, bottom nav, sticky actions.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Button, ButtonLink | `ui/Button.tsx` | variants: primary, secondary, outline, ghost, danger, success; sizes sm/md/lg (≥ 44 px) |
| IconButton | `ui/IconButton.tsx` | 44 × 44, requires `label` |
| Input, Textarea, Select | `ui/Field.tsx` | label, hint, error with `aria-describedby` |
| Checkbox, RadioGroup | `ui/Choice.tsx` | card-style radio options |
| Card, SectionTitle | `ui/Card.tsx` | |
| ProgressBar, CircularProgress | `ui/Progress.tsx` | `role="progressbar"` |
| Badge, LevelBadge | `ui/Badge.tsx` | CEFR colour coding |
| Modal, Drawer, BottomSheet | `ui/Dialog.tsx` | native `<dialog>`; sheet becomes a modal ≥ sm |
| Tabs | `ui/Tabs.tsx` | WAI-ARIA tabs with arrow keys |
| Toast / Toaster | `ui/Toast.tsx` | `toast.success()`; positioned above bottom nav |
| Skeleton, PageSkeleton, EmptyState, ErrorState | `ui/States.tsx` | |
| PageHeader | `ui/PageHeader.tsx` | back button falls back to a route on direct URL access |
| BottomNavigation / SideNavigation | `app/layouts/` | |
| LessonCard, VocabularyCard, ExerciseOption, AchievementCard | `components/learning/` | |

## Motion & accessibility

Short (≤ 240 ms) fade/slide only; all disabled under `prefers-reduced-motion`. Visible focus ring on every control.
Icons are `aria-hidden`; icon-only buttons have labels. Charts include a text alternative.
