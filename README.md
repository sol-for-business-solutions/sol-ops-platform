# SOL Operations Excellence Platform

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Environment variables** — copy `.env.local.example` → `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run the dev server:**
```bash
npm run dev
```
App runs at http://localhost:3000

## THE FIX — Why it was broken
The file was named `proxy.ts` instead of `middleware.ts`, AND it was missing the URL + KEY arguments to `createServerClient`. Both are now fixed:
- File: `src/middleware.ts` (not proxy.ts)
- Function name: `middleware` (not proxy)
- `createServerClient(URL, KEY, { cookies })` — all 3 args present

## To update your existing project
1. Replace your `src/` folder entirely with the one from this zip
2. Delete `src/proxy.ts` if it still exists
3. Make sure `src/middleware.ts` exists (it's included here)
4. Run `npm install next@14.2.0 eslint-config-next@14.2.0` to pin stable Next.js

## Storage buckets to create in Supabase
- `checklist-photos` (public)
- `certificates` (public)

## Supabase Storage CORS
In Supabase Dashboard → Storage → Settings, allow your app URL.
