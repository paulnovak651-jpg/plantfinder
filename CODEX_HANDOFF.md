# Codex Task Prompt — PlantFinder

## Repo
`github.com/paulnovak651-jpg/plantfinder`
Branch: `main`

## Read First
`PLANTFINDER_MASTER_SPEC.md` in the repo root — that is the single source of truth.

## Current State
- Next.js 15 app (App Router, TypeScript, Tailwind)
- Supabase (Postgres) backend — schema deployed, seeded with test data
- Live on Vercel at `plantfinder-cyan.vercel.app`
- Search works: GET `/api/search?q=...&zip=...`
- 6 commits on main, no other branches

## Key Files
```
src/lib/db.ts              # Supabase client (anon + admin singletons)
src/lib/search.ts          # parseQuery(), searchListings(), textMatch(), haversine()
src/lib/seed.ts            # DB seeder — WARNING: contains hardcoded service role key
src/app/api/search/route.ts # Search API endpoint
src/app/search/page.tsx     # Search results UI (has Suspense wrapper)
.env.local                  # Supabase URL + keys (not in repo, on Vercel)
```

## Tasks (in priority order)

### 1. CRITICAL — Remove hardcoded Supabase service role key from seed.ts
- `src/lib/seed.ts` has the service role key hardcoded as a string
- Refactor to read from `process.env.SUPABASE_SERVICE_ROLE_KEY` instead
- The key is already exposed in git history — add a comment noting it needs rotation
- Do NOT delete seed.ts, just remove the hardcoded key

### 2. Fix state parsing bug in search.ts
- `parseQuery()` in `src/lib/search.ts` treats any 2-letter token as a US state code
- Words like "in", "to", "me", "or" get falsely matched as IN, TO, ME, OR
- Fix: validate against an explicit list of real US state abbreviations
- The state code extraction happens after stop word removal, but some 2-letter words survive

### 3. Fix empty-query loading state on /search
- `src/app/search/page.tsx` — when user visits `/search` with no query, it shows a loading spinner forever
- Should show a helpful empty state instead (e.g., "Search for plants above" or example searches)

### 4. Fix lint issues
- `any` type usage in several files — replace with proper types
- `<a href>` tags should use Next.js `<Link>` component
- Run `npx next lint` to find all issues

### 5. Update README.md
- Currently the default Next.js template README
- Replace with project-specific content: what PlantFinder is, how to run locally, env vars needed, architecture overview
- Reference PLANTFINDER_MASTER_SPEC.md for the full spec

## Rules
- Create a separate branch for each task (e.g., `fix/remove-hardcoded-key`, `fix/state-parsing`)
- Open a PR for each task — do NOT push directly to main
- Each PR should have a clear title and description of what changed and why
- Run `npm run build` before opening any PR to ensure it builds on Vercel
- Do not modify .env.local or any environment variables
- Do not change the Supabase schema
- Do not add new dependencies without justification

## Environment
- Node 18+
- npm (not yarn/pnpm)
- `npm install` then `npm run build` to verify
- `npm run dev` for local dev server on port 3000
