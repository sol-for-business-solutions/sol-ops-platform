# SOL Operations Platform — Setup Guide

## Prerequisites
- Node.js 18+
- Supabase project (run the SQL in `supabase/schema.sql`)
- Resend account (for email notifications)
- Unifonic account (for SMS notifications — KSA)

## 1. Environment Variables

Copy `.env.local` and fill in your values:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # needed for certificate uploads

# Email — Resend (https://resend.com)
RESEND_API_KEY=re_...

# SMS — Unifonic (https://app.unifonic.com → API → App SID)
UNIFONIC_APP_SID=your-app-sid
UNIFONIC_SENDER_ID=SOL            # your approved Sender ID

# App URL (used in certificate verification links)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 2. Supabase Storage

Create two public buckets in your Supabase dashboard:
- `certificates`   — stores generated PDF certificates
- `checklist-photos` — stores checklist photo evidence

Bucket policy (already in schema.sql): both public read, authenticated write.

## 3. Supabase Edge Functions

Deploy all three functions:
```bash
supabase functions deploy flag-escalation
supabase functions deploy checkin-monitor
supabase functions deploy checklist-overdue-check
```

Schedule them with pg_cron (run in Supabase SQL editor):
```sql
-- Flag escalation every 30 minutes
select cron.schedule('flag-escalation', '*/30 * * * *',
  $$select net.http_post(url:='https://your-project.supabase.co/functions/v1/flag-escalation',
    headers:='{"Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb)$$);

-- Checkin monitor at 8:30 AM and 9:00 AM KSA (05:30 and 06:00 UTC)
select cron.schedule('checkin-morning-warning', '30 5 * * *',
  $$select net.http_post(url:='https://your-project.supabase.co/functions/v1/checkin-monitor',
    headers:='{"Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb)$$);

select cron.schedule('checkin-morning-noshow', '0 6 * * *',
  $$select net.http_post(url:='https://your-project.supabase.co/functions/v1/checkin-monitor',
    headers:='{"Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb)$$);
```

## 4. Install & Run

```bash
npm install
npm run dev     # development
npm run build   # production build
npm start       # production server
```

## 5. First Login

Create the first super_admin user:
1. Sign up via `/login`
2. In Supabase SQL editor: `update profiles set role = 'super_admin' where email = 'your@email.com';`

## New Features in v1.2

| Feature | Where |
|---|---|
| Bulk course CSV import | Courses → "Bulk import" button |
| Course cloning | Hover over course card → clone icon |
| Certificate regeneration | Certificates page → "Regen" button |
| Check-in map view | Checkins → "Map view" tab |
| Flag analytics | Flags → "Analytics" tab |
| PDF report export | Reports → "Export PDF" button |
| SMS via Unifonic | Auto-triggered for Critical/Emergency flags |
| PWA offline mode | Install via browser "Add to home screen" |
