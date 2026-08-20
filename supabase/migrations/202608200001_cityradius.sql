create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_url text,
  home_city text check (home_city is null or home_city in ('New Delhi', 'Gurugram', 'Noida')),
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  place_key text primary key check (char_length(place_key) between 3 and 180),
  google_place_id text unique,
  slug text unique,
  name text not null check (char_length(name) between 2 and 160),
  category text not null check (category in ('cafe', 'pg', 'library', 'coworking', 'bookstore', 'printing', 'fitness', 'pharmacy')),
  city text,
  area text,
  address text,
  source text not null default 'community' check (source in ('csv', 'curated', 'google', 'community')),
  status text not null default 'unverified' check (status in ('unverified', 'active', 'rejected', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_key text not null references public.places(place_key) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(title) between 3 and 90),
  body text not null check (char_length(body) between 20 and 2000),
  visit_context text check (visit_context is null or char_length(visit_context) <= 80),
  visited_on date,
  status text not null default 'published' check (status in ('pending', 'published', 'hidden', 'rejected')),
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_key)
);

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 180),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_key text not null references public.places(place_key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_key)
);

create table public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  category text not null check (category in ('cafe', 'pg', 'library', 'coworking', 'bookstore', 'printing', 'fitness', 'pharmacy')),
  city text not null check (city in ('New Delhi', 'Gurugram', 'Noida')),
  area text not null check (char_length(area) between 2 and 100),
  google_maps_url text,
  notes text check (notes is null or char_length(notes) <= 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('place', 'review', 'photo')),
  target_id text not null,
  reason text not null check (reason in ('spam', 'inaccurate', 'harassment', 'inappropriate', 'duplicate', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id) on delete restrict,
  target_type text not null,
  target_id text not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create index places_category_city_idx on public.places(category, city) where status in ('active', 'unverified');
create index reviews_place_status_idx on public.reviews(place_key, status, created_at desc);
create index review_photos_review_idx on public.review_photos(review_id, status);
create index place_submissions_status_idx on public.place_submissions(status, created_at);
create index reports_status_idx on public.reports(status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();
create trigger place_submissions_set_updated_at before update on public.place_submissions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_name text;
begin
  inferred_name := initcap(replace(replace(split_part(coalesce(new.email, 'member'), '@', 1), '.', ' '), '_', ' '));
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(inferred_name, ''), 'CityRadius member'), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create or replace function public.ensure_place_for_review(
  p_place_key text,
  p_google_place_id text,
  p_slug text,
  p_name text,
  p_category text,
  p_city text,
  p_area text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if char_length(p_place_key) not between 3 and 180
     or char_length(p_name) not between 2 and 160
     or p_category not in ('cafe', 'pg', 'library', 'coworking', 'bookstore', 'printing', 'fitness', 'pharmacy') then
    raise exception 'Invalid place data';
  end if;

  insert into public.places (
    place_key, google_place_id, slug, name, category, city, area, source, status, created_by
  ) values (
    p_place_key, nullif(p_google_place_id, ''), nullif(p_slug, ''), p_name, p_category,
    nullif(p_city, ''), nullif(p_area, ''),
    case when p_google_place_id is null then 'community' else 'google' end,
    'unverified', auth.uid()
  )
  on conflict (place_key) do nothing;

  return p_place_key;
end;
$$;

create or replace view public.place_rating_summaries
with (security_invoker = true)
as
select
  place_key,
  round(avg(rating)::numeric, 2) as average_rating,
  count(*)::integer as review_count,
  count(*) filter (where rating = 1)::integer as one_star,
  count(*) filter (where rating = 2)::integer as two_star,
  count(*) filter (where rating = 3)::integer as three_star,
  count(*) filter (where rating = 4)::integer as four_star,
  count(*) filter (where rating = 5)::integer as five_star
from public.reviews
where status = 'published'
group by place_key;

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.review_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.place_submissions enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

create policy "Profiles are publicly readable"
on public.profiles for select using (true);
create policy "Users update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

create policy "Active places are publicly readable"
on public.places for select using (status in ('active', 'unverified') or public.is_admin());
create policy "Moderators manage places"
on public.places for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Published reviews are publicly readable"
on public.reviews for select using (status = 'published' or auth.uid() = user_id or public.is_admin());
create policy "Users create their own review"
on public.reviews for insert to authenticated
with check (auth.uid() = user_id and status in ('pending', 'published'));
create policy "Users update their own review"
on public.reviews for update to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
create policy "Users delete their own review"
on public.reviews for delete to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy "Approved review photos are public"
on public.review_photos for select
using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "Users register their own review photos"
on public.review_photos for insert to authenticated
with check (auth.uid() = user_id);
create policy "Users delete their own review photos"
on public.review_photos for delete to authenticated
using (auth.uid() = user_id or public.is_admin());
create policy "Moderators update photo status"
on public.review_photos for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Users read their own favorites"
on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "Users create their own favorites"
on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their own favorites"
on public.favorites for delete to authenticated using (auth.uid() = user_id);

create policy "Users create place submissions"
on public.place_submissions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read their submissions"
on public.place_submissions for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "Moderators update place submissions"
on public.place_submissions for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Users create reports"
on public.reports for insert to authenticated with check (auth.uid() = user_id);
create policy "Users and moderators read reports"
on public.reports for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "Moderators update reports"
on public.reports for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Moderators read moderation log"
on public.moderation_actions for select to authenticated using (public.is_admin());
create policy "Moderators create moderation log"
on public.moderation_actions for insert to authenticated with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload review photos to their folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Approved review photos can be downloaded"
on storage.objects for select
using (
  bucket_id = 'review-photos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (
      select 1 from public.review_photos
      where storage_path = name and status = 'approved'
    )
  )
);
create policy "Users manage review photos in their folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'review-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "Users upload their avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.places, public.reviews, public.review_photos, public.place_rating_summaries to anon, authenticated;
grant insert, update, delete on public.reviews, public.review_photos, public.favorites, public.place_submissions, public.reports to authenticated;
grant select on public.favorites, public.place_submissions, public.reports, public.moderation_actions to authenticated;
grant update(display_name, avatar_url, home_city) on public.profiles to authenticated;
grant update on public.places, public.place_submissions, public.reports, public.moderation_actions to authenticated;
grant insert on public.moderation_actions to authenticated;
grant execute on function public.ensure_place_for_review(text, text, text, text, text, text, text) to authenticated;
