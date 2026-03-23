# SOL Operations Platform — Next.js 16 Setup

## Quick Start

```bash
# 1. Clean install
rm -rf node_modules package-lock.json .next
npm install

# 2. Set up environment
cp .env.local.example .env.local
# → Edit .env.local with your Supabase credentials

# 3. Run
npm run dev
```

## Environment Variables (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...   # optional, for flag email alerts
```

## Supabase Storage Buckets (create once)
In Supabase Dashboard → Storage → New bucket:
- `checklist-photos` → Public
- `certificates` → Public

## What was fixed in this version

### 1. Next.js 15/16 — params & searchParams are Promises
Every dynamic page now uses `await params` / `await searchParams`:
```ts
// Fixed in: courses/[id], courses/[id]/edit, verify/[code]
//           checklists, flags, checkins, attendance
//           API: courses/[id], flags/[id], checklists/[id], trainees/[id]
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### 2. Tailwind v4
- `postcss.config.mjs` → uses `@tailwindcss/postcss`
- `globals.css` → uses `@import "tailwindcss"` + `@plugin "@tailwindcss/forms"`
- `tailwind.config.ts` → **deleted** (not used in v4)

### 3. Arabic RTL
- Inline `<script>` in `<head>` applies `dir="rtl"` before first paint — no flash
- Sidebar nav items flip direction and show Arabic labels
- Topbar shows Arabic name and role when Arabic selected
- Number/phone/email inputs stay LTR in RTL mode

### 4. Certificate PDF generation
- PDF is now generated directly in the `/api/certificates` POST route
- No more internal HTTP fetch (which breaks on Vercel)
- Uses `pdf-lib` — no external service needed

### 5. GPS Check-in
- Haversine distance calculated in JavaScript — no Supabase DB function needed
- Managers/admins can check in without being assigned to the course

### 6. Error boundaries
- `not-found.tsx` for 404s
- `error.tsx` for runtime errors
- Dashboard-level error boundary
