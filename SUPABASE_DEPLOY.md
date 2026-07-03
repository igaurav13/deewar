This project runs Supabase SQL migrations during Vercel builds.

What I added
- `scripts/apply_migrations.js` — Node runner that executes all .sql files in `supabase/migrations`.
- `vercel-build` script in `package.json` which runs the runner then `next build`.
- `pg` added as a devDependency so the runner can connect to Postgres during build.

Vercel setup
1. In your Vercel Project Settings -> Environment Variables, add (Production scope):
   - `DATABASE_URL` — the Postgres connection string for your Supabase database (postgres://...).
     - You can use the Supabase "Connection string" (postgres) from the project settings. Use the primary database URL.
2. (Optional) If you'd rather use `SUPABASE_DB_URL`, add that instead; the runner checks multiple names.
3. Deploy to Vercel. Vercel will run the `vercel-build` script which applies migrations then builds Next.js.

Notes & safety
- The migration runner executes SQL files as-is. Make sure your SQL is safe/idempotent for repeated runs (use `IF NOT EXISTS` or guard DO blocks), and avoid destructive statements that shouldn't run in production.
- Keep `DATABASE_URL` secret and restricted. Prefer a user with appropriate privileges for schema migrations.
- Alternatively, you can run migrations out-of-band (via `supabase db push` locally or CI) and avoid running DB schema changes during Vercel builds.

Local testing
- Ensure `DATABASE_URL` is set locally and run:

```bash
npm ci
npm run vercel-build
```

This will apply migrations and run `next build`.

If you want guidance making the SQL fully idempotent, I can update `supabase/migrations/0001_init.sql` to add existence checks for policies and triggers.
