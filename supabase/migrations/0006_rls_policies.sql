-- Row-level security: household-wide read, own-row write.

alter table public.profiles enable row level security;
alter table public.intake_entries enable row level security;
alter table public.burn_entries enable row level security;
alter table public.daily_steps enable row level security;

create policy "profiles_select_household"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "intake_entries_select_household"
  on public.intake_entries
  for select
  to authenticated
  using (true);

create policy "intake_entries_insert_own"
  on public.intake_entries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "intake_entries_update_own"
  on public.intake_entries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "intake_entries_delete_own"
  on public.intake_entries
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "burn_entries_select_household"
  on public.burn_entries
  for select
  to authenticated
  using (true);

create policy "burn_entries_insert_own"
  on public.burn_entries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "burn_entries_update_own"
  on public.burn_entries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "burn_entries_delete_own"
  on public.burn_entries
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "daily_steps_select_household"
  on public.daily_steps
  for select
  to authenticated
  using (true);

create policy "daily_steps_insert_own"
  on public.daily_steps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "daily_steps_update_own"
  on public.daily_steps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_steps_delete_own"
  on public.daily_steps
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Private meal photo storage (used in milestone 4).
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "meal_photos_select_household"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'meal-photos');

create policy "meal_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "meal_photos_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "meal_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
