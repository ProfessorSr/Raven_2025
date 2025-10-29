insert into public.form_fields (key, scope, label, type, required, unique_field, order_index, system, write_to, visible, help_text)
values ('display_name','both','Display Name','text', false, false, 10, true, 'core', true, 'Public name shown to others')
on conflict do nothing;

insert into public.form_fields (key, scope, label, type, required, unique_field, order_index, system, write_to, visible)
values ('first_name','registration','First Name','text', false, false, 20, false, 'attributes', true)
on conflict do nothing;

insert into public.form_fields (key, scope, label, type, required, unique_field, order_index, system, write_to, visible, options)
values ('favorite_color','profile','Favorite Color','select', false, false, 30, false, 'attributes', true, '["red","green","blue"]'::jsonb)
on conflict do nothing;
