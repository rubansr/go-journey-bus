-- ============ 1. REAL GPS LIVE TRACKING ============
create table if not exists public.bus_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed_kmph numeric(6,2) not null default 0,
  heading numeric(6,2) not null default 0,
  accuracy_m numeric(8,2),
  source text not null default 'driver_device',
  recorded_by uuid,
  recorded_at timestamptz not null default now()
);
create index if not exists bus_locations_trip_time_idx on public.bus_locations (trip_id, recorded_at desc);

grant select on public.bus_locations to anon, authenticated;
grant insert on public.bus_locations to authenticated;
grant all on public.bus_locations to service_role;
alter table public.bus_locations enable row level security;

create policy "gps readable by everyone" on public.bus_locations for select using (true);
create policy "staff can push gps" on public.bus_locations for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'operator'));

-- ============ 2. REWARDS & LOYALTY ============
create table if not exists public.reward_accounts (
  user_id uuid primary key,
  points integer not null default 0,
  lifetime_points integer not null default 0,
  tier text not null default 'bronze',
  trips_count integer not null default 0,
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  referred_by uuid,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.reward_accounts to authenticated;
grant all on public.reward_accounts to service_role;
alter table public.reward_accounts enable row level security;
create policy "own reward account" on public.reward_accounts for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "staff update reward account" on public.reward_accounts for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  points integer not null,
  note text not null default '',
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reward_events_user_idx on public.reward_events (user_id, created_at desc);
grant select on public.reward_events to authenticated;
grant all on public.reward_events to service_role;
alter table public.reward_events enable row level security;
create policy "own reward events" on public.reward_events for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.reward_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  bonus_points integer not null default 0,
  multiplier numeric(4,2) not null default 1,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '30 days'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.reward_campaigns to anon, authenticated;
grant insert, update, delete on public.reward_campaigns to authenticated;
grant all on public.reward_campaigns to service_role;
alter table public.reward_campaigns enable row level security;
create policy "campaigns public read" on public.reward_campaigns for select using (true);
create policy "admin manage campaigns" on public.reward_campaigns for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.reward_tier(p_points integer)
returns text language sql immutable as $$
  select case
    when p_points >= 5000 then 'platinum'
    when p_points >= 2000 then 'gold'
    when p_points >= 750 then 'silver'
    else 'bronze' end;
$$;

create or replace function public.grant_reward_points(p_user uuid, p_points integer, p_kind text, p_note text default '', p_booking uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.reward_accounts (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.reward_accounts
     set points = points + p_points,
         lifetime_points = lifetime_points + greatest(p_points, 0),
         tier = public.reward_tier(lifetime_points + greatest(p_points, 0)),
         updated_at = now()
   where user_id = p_user;
  insert into public.reward_events (user_id, kind, points, note, booking_id)
  values (p_user, p_kind, p_points, coalesce(p_note,''), p_booking);
end;
$$;

create or replace function public.reward_on_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_points integer;
  v_mult numeric := 1;
  v_bonus integer := 0;
  v_first boolean;
begin
  select coalesce(max(multiplier),1), coalesce(max(bonus_points),0)
    into v_mult, v_bonus
    from public.reward_campaigns
   where is_active and now() between starts_at and ends_at;

  v_points := greatest(10, floor(new.total_amount * 0.05 * coalesce(v_mult,1))::int);

  insert into public.reward_accounts (user_id) values (new.user_id) on conflict (user_id) do nothing;
  select trips_count = 0 into v_first from public.reward_accounts where user_id = new.user_id;

  perform public.grant_reward_points(new.user_id, v_points, 'booking', 'Points for booking ' || new.pnr, new.id);
  if coalesce(v_bonus,0) > 0 then
    perform public.grant_reward_points(new.user_id, v_bonus, 'campaign', 'Festival campaign bonus', new.id);
  end if;
  if v_first then
    perform public.grant_reward_points(new.user_id, 200, 'first_booking', 'First booking bonus', new.id);
  end if;

  update public.reward_accounts set trips_count = trips_count + 1 where user_id = new.user_id;

  insert into public.notifications (user_id, kind, title, body, booking_id)
  values (new.user_id, 'reward',
          'You earned ' || v_points || ' NXTIXA points',
          'Points added for PNR ' || new.pnr || '. Redeem them on your next trip.', new.id);
  return new;
end;
$$;

drop trigger if exists trg_reward_on_booking on public.bookings;
create trigger trg_reward_on_booking after insert on public.bookings
for each row execute function public.reward_on_booking();

create or replace function public.redeem_reward_points(p_points integer)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_available integer;
  v_value numeric;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_points is null or p_points < 100 then raise exception 'Redeem at least 100 points'; end if;

  select points into v_available from public.reward_accounts where user_id = v_user for update;
  if v_available is null or v_available < p_points then raise exception 'Not enough points'; end if;

  v_value := p_points * 0.5;

  update public.reward_accounts set points = points - p_points, updated_at = now() where user_id = v_user;
  insert into public.reward_events (user_id, kind, points, note) values (v_user, 'redeem', -p_points, 'Redeemed for wallet credit');

  insert into public.wallets (user_id, balance) values (v_user, 0) on conflict (user_id) do nothing;
  update public.wallets set balance = balance + v_value, updated_at = now() where user_id = v_user;
  insert into public.wallet_transactions (user_id, kind, amount, note)
  values (v_user, 'credit', v_value, 'Rewards redemption (' || p_points || ' points)');

  insert into public.notifications (user_id, kind, title, body)
  values (v_user, 'reward', 'Rewards redeemed', p_points || ' points converted to wallet credit.');

  return v_value;
end;
$$;

create or replace function public.reward_leaderboard()
returns table (rank integer, label text, lifetime_points integer, tier text, is_me boolean)
language sql security definer set search_path = public as $$
  select (row_number() over (order by ra.lifetime_points desc))::int,
         coalesce(nullif(split_part(coalesce(p.full_name,'Traveller'),' ',1),''),'Traveller') || ' ' ||
           upper(substr(coalesce(ra.referral_code,'X'),1,2)),
         ra.lifetime_points, ra.tier, ra.user_id = auth.uid()
    from public.reward_accounts ra
    left join public.profiles p on p.id = ra.user_id
   order by ra.lifetime_points desc
   limit 20;
$$;
grant execute on function public.reward_leaderboard() to authenticated;
grant execute on function public.redeem_reward_points(integer) to authenticated;

-- ============ 3. FAMILY DASHBOARD ============
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid,
  invited_email text,
  display_name text not null default '',
  role text not null default 'member',
  status text not null default 'pending',
  share_location boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists family_members_unique_user on public.family_members (family_id, user_id) where user_id is not null;
create index if not exists family_members_email_idx on public.family_members (lower(invited_email));

grant select, insert, update, delete on public.families to authenticated;
grant select, insert, update, delete on public.family_members to authenticated;
grant all on public.families to service_role;
grant all on public.family_members to service_role;
alter table public.families enable row level security;
alter table public.family_members enable row level security;

create or replace function public.my_family_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select f.id from public.families f where f.owner_id = auth.uid()
  union
  select m.family_id from public.family_members m
   where m.status = 'active'
     and (m.user_id = auth.uid()
          or lower(m.invited_email) = lower(coalesce((select email from auth.users where id = auth.uid()), '')));
$$;

create or replace function public.family_invites_for_me()
returns setof uuid language sql stable security definer set search_path = public as $$
  select m.family_id from public.family_members m
   where lower(coalesce(m.invited_email,'')) = lower(coalesce((select email from auth.users where id = auth.uid()), ''));
$$;

create policy "family visible to members" on public.families for select to authenticated
  using (owner_id = auth.uid() or id in (select public.my_family_ids()) or id in (select public.family_invites_for_me()));
create policy "create own family" on public.families for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates family" on public.families for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes family" on public.families for delete to authenticated using (owner_id = auth.uid());

create policy "members visible to family" on public.family_members for select to authenticated
  using (family_id in (select public.my_family_ids()) or family_id in (select public.family_invites_for_me()));
create policy "owner invites" on public.family_members for insert to authenticated
  with check (exists (select 1 from public.families f where f.id = family_id and f.owner_id = auth.uid()));
create policy "member or owner updates" on public.family_members for update to authenticated
  using (user_id = auth.uid()
         or lower(coalesce(invited_email,'')) = lower(coalesce((select email from auth.users where id = auth.uid()),''))
         or exists (select 1 from public.families f where f.id = family_id and f.owner_id = auth.uid()));
create policy "owner removes member" on public.family_members for delete to authenticated
  using (exists (select 1 from public.families f where f.id = family_id and f.owner_id = auth.uid()));

create or replace function public.shares_family(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.family_members m
     where m.family_id in (select public.my_family_ids())
       and m.status = 'active'
       and m.share_location
       and m.user_id = p_other
  ) or exists (
    select 1 from public.families f
     where f.id in (select public.my_family_ids()) and f.owner_id = p_other
  );
$$;
grant execute on function public.shares_family(uuid) to authenticated;
grant execute on function public.my_family_ids() to authenticated;
grant execute on function public.family_invites_for_me() to authenticated;

create policy "family members see shared bookings" on public.bookings for select to authenticated
  using (public.shares_family(user_id));

create or replace function public.accept_family_invite(p_family uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  update public.family_members
     set user_id = auth.uid(), status = 'active'
   where family_id = p_family
     and (user_id = auth.uid() or lower(coalesce(invited_email,'')) = lower(coalesce(v_email,'')));
end;
$$;
grant execute on function public.accept_family_invite(uuid) to authenticated;

-- ============ 4. PAYMENT FAILURE AUTO-RECOVERY ============
create table if not exists public.recovery_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  trip_id uuid references public.trips(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  attempt_id uuid references public.payment_attempts(id) on delete set null,
  reference text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  amount numeric(10,2) not null default 0,
  money_debited boolean not null default false,
  duplicate_of uuid,
  status text not null default 'processing',
  timeline jsonb not null default '[]'::jsonb,
  resolution text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recovery_cases_user_idx on public.recovery_cases (user_id, created_at desc);
grant select, insert, update on public.recovery_cases to authenticated;
grant all on public.recovery_cases to service_role;
alter table public.recovery_cases enable row level security;
create policy "own recovery cases" on public.recovery_cases for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'operator'));
create policy "create own recovery case" on public.recovery_cases for insert to authenticated
  with check (user_id = auth.uid());
create policy "staff update recovery case" on public.recovery_cases for update to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'operator'));

create or replace function public.open_recovery_case(
  p_trip uuid, p_amount numeric, p_money_debited boolean default true,
  p_attempt uuid default null, p_error text default ''
) returns public.recovery_cases
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_dup uuid;
  v_case public.recovery_cases;
begin
  if v_user is null then raise exception 'Not signed in'; end if;

  select id into v_dup from public.recovery_cases
   where user_id = v_user and trip_id = p_trip and amount = p_amount
     and created_at > now() - interval '15 minutes'
   order by created_at desc limit 1;

  insert into public.recovery_cases (user_id, trip_id, amount, money_debited, attempt_id, duplicate_of, status, timeline)
  values (v_user, p_trip, coalesce(p_amount,0), coalesce(p_money_debited,false), p_attempt, v_dup,
          'verifying_payment',
          jsonb_build_array(
            jsonb_build_object('status','processing','at', now(), 'note', coalesce(nullif(p_error,''),'Payment failure detected')),
            jsonb_build_object('status','verifying_payment','at', now(), 'note','Verifying the payment with the gateway')
          ))
  returning * into v_case;

  insert into public.support_tickets (user_id, subject, message, status)
  values (v_user, 'Payment recovery ' || v_case.reference,
          'Automatic case opened for amount ' || v_case.amount || '. ' || coalesce(p_error,''), 'open');

  insert into public.notifications (user_id, kind, title, body)
  values (v_user, 'recovery', 'We are protecting your payment',
          'Case ' || v_case.reference || ' opened. We are verifying your payment and will confirm your seat or refund automatically.');

  return v_case;
end;
$$;
grant execute on function public.open_recovery_case(uuid, numeric, boolean, uuid, text) to authenticated;

create or replace function public.advance_recovery_case(p_case uuid, p_status text, p_note text default '', p_booking uuid default null)
returns public.recovery_cases language plpgsql security definer set search_path = public as $$
declare
  v_case public.recovery_cases;
  v_refund numeric;
begin
  select * into v_case from public.recovery_cases where id = p_case for update;
  if v_case is null then raise exception 'Case not found'; end if;
  if v_case.user_id <> auth.uid()
     and not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'operator')) then
    raise exception 'Not allowed';
  end if;

  if p_status = 'refund_initiated' and v_case.money_debited and v_case.status <> 'refund_initiated' then
    v_refund := v_case.amount;
    insert into public.wallets (user_id, balance) values (v_case.user_id, 0) on conflict (user_id) do nothing;
    update public.wallets set balance = balance + v_refund, updated_at = now() where user_id = v_case.user_id;
    insert into public.wallet_transactions (user_id, kind, amount, note)
    values (v_case.user_id, 'credit', v_refund, 'Auto-refund for recovery case ' || v_case.reference);
  end if;

  update public.recovery_cases
     set status = p_status,
         booking_id = coalesce(p_booking, booking_id),
         resolution = case when p_status in ('resolved','booking_confirmed','refund_initiated') then coalesce(nullif(p_note,''), resolution) else resolution end,
         timeline = timeline || jsonb_build_object('status', p_status, 'at', now(), 'note', coalesce(p_note,'')),
         updated_at = now()
   where id = p_case
  returning * into v_case;

  insert into public.notifications (user_id, kind, title, body, booking_id)
  values (v_case.user_id, 'recovery', 'Recovery update: ' || replace(p_status,'_',' '),
          coalesce(nullif(p_note,''), 'Your payment recovery case ' || v_case.reference || ' was updated.'), v_case.booking_id);

  return v_case;
end;
$$;
grant execute on function public.advance_recovery_case(uuid, text, text, uuid) to authenticated;

insert into public.reward_campaigns (title, description, bonus_points, multiplier, ends_at)
select 'Pongal Travel Festival', 'Double points plus 150 bonus points on every booking this season.', 150, 2, now() + interval '60 days'
where not exists (select 1 from public.reward_campaigns);