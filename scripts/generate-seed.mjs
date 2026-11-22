// Writes supabase/seed.sql from src/data (TypeScript is loaded through Vite's SSR loader).
// Usage: npm run db:seed:generate
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buildSeedSql } = await server.ssrLoadModule('/scripts/seed-sql.ts');
  const target = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url));
  await writeFile(target, buildSeedSql(), 'utf8');
  console.log('wrote supabase/seed.sql');
} finally {
  await server.close();
}
