-- Returns past Argentina-local days that have sales or expenses but no row in
-- cash_closings, oldest first. Used by the home screen to prompt the user to
-- close days that were left open.
--
-- Additive and read-only: safe to run on a live database. SECURITY INVOKER (the
-- default) so RLS on sales/expenses/cash_closings still applies.

create or replace function public.pending_closing_dates()
returns table (closing_date date)
language sql
stable
as $$
  select d.day as closing_date
  from (
    select (created_at at time zone 'America/Argentina/Buenos_Aires')::date as day
    from public.sales
    union
    select (created_at at time zone 'America/Argentina/Buenos_Aires')::date
    from public.expenses
  ) d
  where d.day < (now() at time zone 'America/Argentina/Buenos_Aires')::date
    and not exists (select 1 from public.cash_closings c where c.date = d.day)
  order by d.day;
$$;

revoke execute on function public.pending_closing_dates() from anon;
grant execute on function public.pending_closing_dates() to authenticated;
