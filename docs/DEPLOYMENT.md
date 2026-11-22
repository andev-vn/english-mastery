# Deployment

> Not deployed yet. These are the steps to deploy; nothing here has been executed against a live account.

## Cloudflare Pages (frontend)

1. Push the repository to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select the repo.
3. Build settings:
   - Framework preset: **None** (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION=22`
4. Deploy. SPA routing works automatically (Pages serves `index.html` for unknown paths when no `404.html` exists).
5. `public/_headers` sets long-term caching for hashed assets and `no-cache` for `sw.js`, `index.html` and the manifest
   so users receive updates.

Phase 2 will add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Pages environment variables
(the anon key is public by design; RLS protects data). **Never** add the service-role key or AI keys to Pages.

## Supabase (Phase 2)

1. Create a project (free tier). Note URL + anon key.
2. `npx supabase link --project-ref <ref>` then `npx supabase db push` to apply `supabase/migrations`.
3. Seed published content with `supabase/seed.sql`.
4. Auth → URL configuration: site URL = Pages domain; add redirect URLs for password reset.
5. (Optional, Phase 6) `npx supabase functions deploy ai-tutor` and `npx supabase secrets set AI_API_KEY=…`.

## Free-tier limits (check current values before launch — providers change them)

| Service | Relevant limits (at time of writing) | Impact |
| --- | --- | --- |
| Cloudflare Pages Free | 500 builds/month, 1 concurrent build, 20,000 files per site, 25 MiB per file | Static hosting is effectively unmetered for bandwidth |
| Supabase Free | 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users, Edge Function invocation quota; **projects pause after ~1 week of inactivity** | A paused project makes sync/login unavailable; the app keeps working offline/guest |
| AI providers | Paid per token | Optional; disabled when not configured |

The app is designed to degrade gracefully: if Supabase is unreachable or paused, content and guest progress still work locally.
