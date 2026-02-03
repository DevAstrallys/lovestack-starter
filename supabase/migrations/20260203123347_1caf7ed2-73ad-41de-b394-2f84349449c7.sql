-- Ajouter les colonnes manquantes pour le système d'initiality et relances
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS initiality text DEFAULT 'initial',
ADD COLUMN IF NOT EXISTS follow_up_of_id uuid REFERENCES public.tickets(id),
ADD COLUMN IF NOT EXISTS relance_index integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS action_code text;

-- Recréer le trigger compute_relance_index avec vérification de l'existence de la colonne
CREATE OR REPLACE FUNCTION public.compute_relance_index()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  n integer;
BEGIN
  IF NEW.initiality = 'relance' AND NEW.follow_up_of_id IS NOT NULL THEN
    SELECT count(*) INTO n
    FROM tickets t
    WHERE t.follow_up_of_id = NEW.follow_up_of_id
      AND t.initiality = 'relance';
    NEW.relance_index := n + 1;
  ELSE
    NEW.relance_index := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- S'assurer que le trigger est bien attaché à la table
DROP TRIGGER IF EXISTS compute_relance_index_trigger ON public.tickets;
CREATE TRIGGER compute_relance_index_trigger
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.compute_relance_index();