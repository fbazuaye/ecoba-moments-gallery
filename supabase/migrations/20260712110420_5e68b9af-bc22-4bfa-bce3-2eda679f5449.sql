
CREATE OR REPLACE FUNCTION public.claim_first_super_admin()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID;
  existing INT;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RETURN 'not_signed_in'; END IF;
  SELECT COUNT(*) INTO existing FROM public.user_roles WHERE role = 'super_admin';
  IF existing > 0 THEN RETURN 'already_claimed'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'super_admin')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN 'ok';
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_first_super_admin() TO authenticated;
