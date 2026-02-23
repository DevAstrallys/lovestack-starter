
-- Fix search_path on regenerate_qr_code (SECURITY DEFINER without SET search_path)
CREATE OR REPLACE FUNCTION public.regenerate_qr_code(qr_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_version INTEGER;
    result_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.qr_codes qr
        WHERE qr.id = qr_id
        AND qr.organization_id IN (
            SELECT m.organization_id 
            FROM public.memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.is_active = true
        )
    ) THEN
        RAISE EXCEPTION 'Accès refusé au QR code';
    END IF;

    SELECT version + 1 INTO new_version 
    FROM public.qr_codes 
    WHERE id = qr_id;

    UPDATE public.qr_codes 
    SET 
        version = new_version,
        last_regenerated_at = now()
    WHERE id = qr_id
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$function$;
