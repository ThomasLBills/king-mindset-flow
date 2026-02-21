CREATE OR REPLACE FUNCTION public.auto_join_default_channels()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO chat_channel_members (channel_id, user_id)
  SELECT id, NEW.user_id FROM chat_channels WHERE is_default = true
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;