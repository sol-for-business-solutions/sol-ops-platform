# SOL Operations Platform — Setup Guide

## Prerequisites
- Node.js 18+
- Supabase project (Pro plan recommended for pg_cron)
- Vercel account (connected to GitHub repo)
- Resend account (email) — resend.com
- Unifonic account (SMS, KSA) — unifonic.com

---

## 1. Supabase Setup

### 1a. Run the schema
Execute `supabase/schema.sql` in your Supabase SQL Editor.

### 1b. Run additional SQL
```sql
-- Haversine distance function (required for GPS check-in)
create or replace function public.haversine_distance(
  lat1 float, lng1 float, lat2 float, lng2 float
)
returns float language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin((radians(lat2) - radians(lat1)) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin((radians(lng2) - radians(lng1)) / 2), 2)
  ))
$$;

-- Allow public certificate verification (no login required)
create policy "Public can verify certificates by code"
  on public.certificates for select
  using (true);
```

### 1c. Enable extensions
Go to Database → Extensions and enable:
- `pg_cron` (for scheduled functions)
- `pg_net` (for HTTP calls from cron jobs)
- `uuid-ossp` (already in schema)

### 1d. Create Storage buckets
Go to Storage → New Bucket:
| Name              | Public |
|-------------------|--------|
| `certificates`    | ✅ Yes |
| `checklist-photos`| ✅ Yes |

For each bucket, add policies:
```sql
create policy "Authenticated upload" on storage.objects for insert
  with check (auth.role() = 'authenticated');
create policy "Public read" on storage.objects for select
  using (true);
```

---

## 2. Environment Variables

### Local development — `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxx
UNIFONIC_APP_SID=your-unifonic-sid
UNIFONIC_SENDER_ID=SOL
```

### Vercel — add same vars in Settings → Environment Variables

---

## 3. Deploy Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id

supabase functions deploy flag-escalation
supabase functions deploy checkin-monitor
supabase functions deploy checklist-overdue-check

# Set secrets
supabase secrets set NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set UNIFONIC_APP_SID=your-sid
supabase secrets set UNIFONIC_SENDER_ID=SOL
```

---

## 4. Configure pg_cron Schedules

Run in Supabase SQL Editor (requires pg_net + pg_cron enabled):

```sql
-- Flag escalation: every 30 minutes
select cron.schedule(
  'flag-escalation',
  '*/30 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/flag-escalation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Checkin monitor: every 10 min, 5-8 AM UTC (= 8-11 AM KSA / UTC+3)
select cron.schedule(
  'checkin-monitor',
  '*/10 5-8 * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/checkin-monitor',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Overdue checklist check: daily at 6 PM UTC (= 9 PM KSA)
select cron.schedule(
  'checklist-overdue',
  '0 18 * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/checklist-overdue-check',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Weekly report digest: every Sunday at 5 AM UTC (= 8 AM KSA)
select cron.schedule(
  'weekly-report',
  '0 5 * * 0',
  $$
    select net.http_post(
      url := current_setting('app.app_url') || '/api/reports/email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{"frequency":"weekly"}'::jsonb
    );
  $$
);
```

Note: Replace `current_setting('app.supabase_url')` with your actual URL string if
`app.supabase_url` is not set as a Postgres setting. Alternatively use the Supabase
Dashboard → Edge Functions → Schedules UI (available in newer dashboard versions).

---

## 5. Create First Super Admin

1. Go to Supabase → Authentication → Users → Invite user
2. Create the user with email/password
3. Then run in SQL Editor:
```sql
update public.profiles
set role = 'super_admin'
where email = 'your-admin@email.com';
```

---

## 6. Verify Deployment

After pushing to GitHub (Vercel auto-deploys):
1. Open your Vercel URL → should show the login page
2. Log in as super_admin
3. Go to Settings → Checklists tab → verify templates load
4. Create a test course → check for conflict validation
5. Go to /verify/TEST-CODE → should show "Certificate Not Found" cleanly

---

## Data Residency (PDPL Compliance)

Ensure your Supabase project is created in a GCC-region:
- `ap-southeast-1` (Singapore) — closest available
- `me-central1` (UAE) — if available in your Supabase plan

Document the chosen region for your PDPL compliance records.

---

## Support
Platform: SOL For Business Solution  
Version: 1.1  
Stack: Next.js 16 · Supabase · Vercel · pdf-lib · Unifonic · Resend
