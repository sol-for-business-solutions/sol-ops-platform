-- SOL Operations Platform — Complete Schema
-- Run this in your Supabase SQL Editor

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  full_name_ar text not null default '',
  role text not null check (role in ('super_admin','manager','coordinator','viewer')) default 'coordinator',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure handle_new_user();

-- CITIES (16 KSA cities)
create table if not exists cities (
  id uuid primary key default uuid_generate_v4(),
  name_en text not null, name_ar text not null,
  region_en text not null, region_ar text not null,
  lat numeric not null, lng numeric not null
);

insert into cities (name_en, name_ar, region_en, region_ar, lat, lng) values
('Riyadh','الرياض','Central','وسط',24.7136,46.6753),
('Jeddah','جدة','Western','غرب',21.4858,39.1925),
('Mecca','مكة المكرمة','Western','غرب',21.3891,39.8579),
('Medina','المدينة المنورة','Western','غرب',24.5247,39.5692),
('Dammam','الدمام','Eastern','شرق',26.4207,50.0888),
('Khobar','الخبر','Eastern','شرق',26.2361,50.1939),
('Dhahran','الظهران','Eastern','شرق',26.2793,50.1522),
('Jubail','الجبيل','Eastern','شرق',27.0046,49.6644),
('Tabuk','تبوك','Northwest','شمال غرب',28.3838,36.5550),
('Abha','أبها','Southwest','جنوب غرب',18.2164,42.5053),
('Hail','حائل','North','شمال',27.5219,41.7057),
('Najran','نجران','South','جنوب',17.5656,44.2289),
('Jazan','جازان','South','جنوب',16.8894,42.5511),
('Al Kharj','الخرج','Central','وسط',24.1551,47.3116),
('Qatif','القطيف','Eastern','شرق',26.5085,50.0097),
('Buraydah','بريدة','Central','وسط',26.3260,43.9750)
on conflict do nothing;

-- COURSES
create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  title_en text not null, title_ar text not null,
  city_id uuid references cities(id) on delete restrict,
  venue text not null,
  day1_date date not null, day2_date date not null,
  trainer_name text not null,
  capacity integer not null default 30,
  status text not null check (status in ('draft','scheduled','in_progress','completed','archived')) default 'draft',
  course_type text not null default 'standard',
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COURSE ASSIGNMENTS
create table if not exists course_assignments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  coordinator_id uuid not null references profiles(id) on delete cascade,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  unique(course_id, coordinator_id)
);

-- CHECKLIST TEMPLATES
create table if not exists checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  course_type text not null default 'standard',
  phase text not null check (phase in ('pre','during','post')),
  title_en text not null, title_ar text not null,
  description text,
  requires_photo boolean not null default false,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into checklist_templates (course_type, phase, title_en, title_ar, requires_photo, order_index) values
('standard','pre','Venue booking confirmed','تأكيد حجز المكان',false,1),
('standard','pre','Hotel contact verified','التحقق من جهة اتصال الفندق',false,2),
('standard','pre','Trainer travel confirmed','تأكيد سفر المدرب',false,3),
('standard','pre','Trainee list finalized','إنهاء قائمة المتدربين',false,4),
('standard','pre','Training materials printed','طباعة مواد التدريب',false,5),
('standard','pre','Projector & AV setup confirmed','تأكيد إعداد العرض والصوت',false,6),
('standard','during','Venue setup complete','اكتمال إعداد القاعة',true,7),
('standard','during','Attendance sheet ready','جاهزية ورقة الحضور',false,8),
('standard','during','Trainer arrived and ready','وصول المدرب وجاهزيته',false,9),
('standard','during','Day 1 AM attendance marked','تسجيل حضور صباح اليوم الأول',false,10),
('standard','during','Day 1 PM attendance marked','تسجيل حضور مساء اليوم الأول',false,11),
('standard','during','Day 2 AM attendance marked','تسجيل حضور صباح اليوم الثاني',false,12),
('standard','during','Day 2 PM attendance marked','تسجيل حضور مساء اليوم الثاني',false,13),
('standard','post','Venue cleaned and cleared','تنظيف وإخلاء القاعة',true,14),
('standard','post','Certificates generated and sent','إنشاء الشهادات وإرسالها',false,15)
on conflict do nothing;

-- CHECKLIST ITEMS
create table if not exists checklist_items (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  template_id uuid references checklist_templates(id),
  phase text not null check (phase in ('pre','during','post')),
  title_en text not null, title_ar text not null,
  description text,
  requires_photo boolean not null default false,
  is_completed boolean not null default false,
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  photo_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- FLAGS
create table if not exists flags (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  raised_by uuid not null references profiles(id),
  severity text not null check (severity in ('info','warning','critical','emergency')) default 'info',
  category text not null check (category in ('trainer_issue','venue_issue','equipment_failure','low_turnout','medical_emergency','other')),
  description text not null,
  photo_url text,
  status text not null check (status in ('open','acknowledged','in_progress','resolved')) default 'open',
  acknowledged_by uuid references profiles(id),
  acknowledged_at timestamptz,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  escalated_from text,
  escalated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHECKINS
create table if not exists checkins (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  coordinator_id uuid not null references profiles(id),
  day integer not null check (day in (1,2)),
  type text not null check (type in ('in','out')),
  lat numeric not null, lng numeric not null,
  is_valid boolean not null default true,
  distance_meters integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id, coordinator_id, day, type)
);

-- TRAINEES
create table if not exists trainees (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  full_name_en text not null, full_name_ar text not null,
  national_id_last4 char(4) not null,
  phone text not null,
  email text,
  consent_given boolean not null default false,
  consent_given_at timestamptz,
  created_at timestamptz not null default now()
);

-- ATTENDANCE
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  trainee_id uuid not null references trainees(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  session text not null check (session in ('day1_am','day1_pm','day2_am','day2_pm')),
  is_present boolean not null default true,
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now(),
  unique(trainee_id, session)
);

-- CERTIFICATES
create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  trainee_id uuid not null references trainees(id),
  course_id uuid not null references courses(id),
  verification_code char(14) not null unique,
  pdf_url text,
  generated_by uuid references profiles(id),
  generated_at timestamptz not null default now(),
  version integer not null default 1
);

-- AUDIT LOG
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text not null,
  table_name text not null,
  record_id text,
  old_values jsonb, new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- HAVERSINE DISTANCE FUNCTION
create or replace function haversine_distance(lat1 float, lng1 float, lat2 float, lng2 float)
returns float language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin((radians(lat2) - radians(lat1)) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin((radians(lng2) - radians(lng1)) / 2), 2)
  ))
$$;

-- STORAGE BUCKETS (run in dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('checklist-photos', 'checklist-photos', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('certificates', 'certificates', true) on conflict do nothing;

-- RLS POLICIES
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_assignments enable row level security;
alter table checklist_items enable row level security;
alter table flags enable row level security;
alter table checkins enable row level security;
alter table trainees enable row level security;
alter table attendance enable row level security;
alter table certificates enable row level security;
alter table audit_log enable row level security;
alter table cities enable row level security;

-- Allow authenticated users to read cities
create policy "cities_read" on cities for select using (auth.role() = 'authenticated');

-- Profiles: users can read all, update own
create policy "profiles_read" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Courses: authenticated can read/write
create policy "courses_all" on courses for all using (auth.role() = 'authenticated');
create policy "course_assignments_all" on course_assignments for all using (auth.role() = 'authenticated');
create policy "checklist_items_all" on checklist_items for all using (auth.role() = 'authenticated');
create policy "checklist_templates_read" on checklist_templates for select using (auth.role() = 'authenticated');
create policy "flags_all" on flags for all using (auth.role() = 'authenticated');
create policy "checkins_all" on checkins for all using (auth.role() = 'authenticated');
create policy "trainees_all" on trainees for all using (auth.role() = 'authenticated');
create policy "attendance_all" on attendance for all using (auth.role() = 'authenticated');
create policy "certificates_all" on certificates for all using (auth.role() = 'authenticated');
create policy "audit_log_all" on audit_log for all using (auth.role() = 'authenticated');
