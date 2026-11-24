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

Supabase environment variables (Pages → Settings → Environment variables, for Production and Preview):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (public by design; RLS protects the data) |

**Never** add the secret key (`sb_secret_…`), the legacy service-role key or AI keys to Pages. The app refuses to start
with them anyway (`src/lib/env.ts`). Without these variables the app runs in guest mode.

## Supabase

1. Create a project (free tier). Copy the project URL and publishable key from **Connect → Framework**.
   Choose React/Vite there; the Next.js snippet (`@supabase/ssr`, `NEXT_PUBLIC_*`) does not apply to this app.
2. Local `.env.local` (git-ignored):
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Apply the schema and content, using either:
   - the CLI: `npx supabase login`, then `npm run db:link`, then `npm run db:push` (CLI v3 targets the local stack unless `--remote` is passed; the script includes it). After content changes, run
     `npm run db:seed:push`, because `db push` does not re-run a seed that was already applied; or
   - the dashboard: SQL Editor, paste and run the migration file, then `supabase/seed.sql`.
4. **Authentication → URL Configuration**:
   - Site URL: your production URL (e.g. `https://english-mastery.pages.dev`), or `http://localhost:5173` while developing.
   - Redirect URLs: `http://localhost:5173/auth/callback`, `https://<your-domain>/auth/callback`
     (and `https://*.<project>.pages.dev/auth/callback` for preview deployments).
5. **Authentication → Providers → Email**: keep "Confirm email" on (recommended). Set the password policy to at least
   8 characters with letters and digits, matching the app's form validation and `supabase/config.toml`.
6. The free tier's built-in email sender allows only a few emails per hour, which is fine for testing.
   For real users, configure custom SMTP (Authentication → Emails → SMTP), e.g. a free tier from an email provider.
7. Optional AI tutor:
   ```
   npx supabase functions deploy ai-tutor --use-api
   npx supabase secrets set ANTHROPIC_API_KEY=<your key>     # never a VITE_* variable
   npx supabase secrets set AI_MODEL=claude-opus-5-5         # optional; this is the default
   npx supabase secrets set AI_DAILY_LIMIT=30                # optional; requests per user per 24 h
   ```
   Without `ANTHROPIC_API_KEY` the function answers `available: false` and the app shows "Gia sư AI chưa được bật".
   AI usage is billed by the provider per token; the daily limit caps the cost per learner.

## Free-tier limits (check current values before launch — providers change them)

| Service | Relevant limits (at time of writing) | Impact |
| --- | --- | --- |
| Cloudflare Pages Free | 500 builds/month, 1 concurrent build, 20,000 files per site, 25 MiB per file | Static hosting is effectively unmetered for bandwidth |
| Supabase Free | 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users, Edge Function invocation quota; **projects pause after ~1 week of inactivity** | A paused project makes sync/login unavailable; the app keeps working offline/guest |
| AI providers | Paid per token | Optional; disabled when not configured |

The app is designed to degrade gracefully: if Supabase is unreachable or paused, content and guest progress still work locally.
