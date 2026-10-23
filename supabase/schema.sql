-- 루시드컬러 데일리메모 데이터베이스
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여 넣고 Run 하세요. 한 번만 실행하면 됩니다.

-- 1. 할 일
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  text text not null check (char_length(text) between 1 and 500),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists todos_user_date_idx on public.todos (user_id, date);

-- 2. 날짜별 학습 메모 (하루에 한 줄)
create table if not exists public.journals (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  learned text not null default '',
  verified text not null default '',
  diff text not null default '',
  questions text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 3. 배울 것 체크 (항목을 배운 날짜)
create table if not exists public.learn_checks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id text not null,
  checked_on date not null default current_date,
  primary key (user_id, item_id)
);

-- 4. 직접 추가한 배울 것
create table if not exists public.custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

-- 행 단위 보안: 로그인한 본인의 기록만 읽고 쓸 수 있습니다.
alter table public.todos enable row level security;
alter table public.journals enable row level security;
alter table public.learn_checks enable row level security;
alter table public.custom_items enable row level security;

drop policy if exists "own todos" on public.todos;
create policy "own todos" on public.todos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own journals" on public.journals;
create policy "own journals" on public.journals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own checks" on public.learn_checks;
create policy "own checks" on public.learn_checks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own custom items" on public.custom_items;
create policy "own custom items" on public.custom_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. 가입한 사람 이름 (Table Editor에서 user_id가 누구인지 보기 위한 표)
-- 가입하면 아래 트리거가 자동으로 한 줄을 넣습니다.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 표를 만들기 전에 가입한 사람도 채워 넣습니다.
insert into public.profiles (user_id, name)
select id, coalesce(raw_user_meta_data->>'name', email) from auth.users
on conflict (user_id) do nothing;
