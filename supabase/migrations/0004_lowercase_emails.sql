-- Make existing emails lowercase so case-insensitive lookups always work
update public.users set email = lower(email) where email != lower(email);
update public.users set approved_by = lower(approved_by) where approved_by is not null and approved_by != lower(approved_by);
