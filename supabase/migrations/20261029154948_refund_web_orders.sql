create or replace function public.refund_web_order_by_payment_intent(
  p_payment_intent text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  ord public.web_orders%rowtype;
begin
  if coalesce(p_payment_intent, '') = '' then
    raise exception 'payment_intent_required';
  end if;

  select * into ord
    from public.web_orders
   where stripe_payment_intent_id = p_payment_intent
   for update;

  if not found then
    return jsonb_build_object('status', 'order_not_found');
  end if;
  if ord.payment_status = 'refunded' then
    return jsonb_build_object('status', 'already_refunded', 'order_number', ord.order_number);
  end if;
  if ord.payment_status <> 'paid' then
    return jsonb_build_object('status', 'not_paid', 'order_number', ord.order_number);
  end if;

  update public.web_orders set payment_status = 'refunded' where id = ord.id;
  if ord.license_key_hash is not null then
    update public.licenses set status = 'revoked'
     where key_hash = ord.license_key_hash and status = 'active';
  end if;
  return jsonb_build_object('status', 'refunded', 'order_number', ord.order_number);
end;
$function$;

revoke all on function public.refund_web_order_by_payment_intent(text) from public, anon, authenticated;
grant execute on function public.refund_web_order_by_payment_intent(text) to service_role;
