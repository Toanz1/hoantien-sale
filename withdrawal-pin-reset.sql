-- Hoàn Tiền Sale - secure withdrawal PIN recovery
-- Run in Supabase SQL Editor after the withdrawal_pins migration.

create extension if not exists pgcrypto;

create or replace function public.reset_withdrawal_pin_after_recovery(p_new_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_amr jsonb;
  v_has_recovery boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_new_pin is null or p_new_pin !~ '^[0-9]{6}$' then
    raise exception 'INVALID_PIN_FORMAT';
  end if;

  -- Password-recovery sessions issued by Supabase carry an AMR entry
  -- whose method is "recovery". A normal signed-in session must not pass.
  v_amr := coalesce(auth.jwt() -> 'amr', '[]'::jsonb);

  select exists (
    select 1
    from jsonb_array_elements(v_amr) as item
    where item ->> 'method' = 'recovery'
  ) into v_has_recovery;

  if not v_has_recovery then
    raise exception 'RECOVERY_VERIFICATION_REQUIRED';
  end if;

  insert into public.withdrawal_pins (user_id, pin_hash, created_at, updated_at)
  values (
    v_user_id,
    crypt(p_new_pin, gen_salt('bf', 10)),
    now(),
    now()
  )
  on conflict (user_id)
  do update set
    pin_hash = excluded.pin_hash,
    updated_at = now();

  return json_build_object('success', true);
end;
$$;

revoke all on function public.reset_withdrawal_pin_after_recovery(text) from public;
revoke all on function public.reset_withdrawal_pin_after_recovery(text) from anon;
grant execute on function public.reset_withdrawal_pin_after_recovery(text) to authenticated;
