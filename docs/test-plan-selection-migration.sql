-- Temporary paymentless plan selection for final app testing.
-- Members may activate only their own Free, Plus, or Pro subscription.

drop policy if exists "Public read active plans" on public.plans;
create policy "Public read active plans" on public.plans for select to anon using (active);
grant select on public.plans to anon;

drop policy if exists "Members choose test subscription" on public.subscriptions;
create policy "Members choose test subscription"
on public.subscriptions
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and plan_code in ('free', 'plus', 'pro')
  and status = 'active'
  and provider = 'manual'
  and current_period_end is null
  and cancel_at_period_end = false
);

revoke insert, delete on public.subscriptions from authenticated;
revoke update on public.subscriptions from authenticated;
grant update (plan_code, status, provider, current_period_end, cancel_at_period_end, updated_at)
on public.subscriptions to authenticated;

create or replace function private.log_test_subscription_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan_code is distinct from old.plan_code and new.provider = 'manual' then
    insert into public.billing_events (provider, event_type, processing_status, payload)
    values ('manual', 'test_plan_activated', 'processed',
      jsonb_build_object('user_id', new.user_id, 'plan_code', new.plan_code, 'subscription_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists on_test_subscription_change on public.subscriptions;
create trigger on_test_subscription_change
after update of plan_code on public.subscriptions
for each row execute procedure private.log_test_subscription_change();
