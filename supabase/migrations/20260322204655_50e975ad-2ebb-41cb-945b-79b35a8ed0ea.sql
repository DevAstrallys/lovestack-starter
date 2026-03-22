
-- 1. Drop the composite PK that includes user_id
ALTER TABLE public.ticket_followers DROP CONSTRAINT ticket_followers_pkey;

-- 2. Add a proper UUID primary key
ALTER TABLE public.ticket_followers
ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.ticket_followers
ADD CONSTRAINT ticket_followers_pkey PRIMARY KEY (id);

-- 3. Add new columns
ALTER TABLE public.ticket_followers
ADD COLUMN IF NOT EXISTS follower_email text,
ADD COLUMN IF NOT EXISTS follower_name text,
ADD COLUMN IF NOT EXISTS follower_phone text;

-- 4. Make user_id nullable
ALTER TABLE public.ticket_followers
ALTER COLUMN user_id DROP NOT NULL;

-- 5. Constraint: at least one identity
ALTER TABLE public.ticket_followers
ADD CONSTRAINT chk_follower_identity
CHECK (user_id IS NOT NULL OR follower_email IS NOT NULL);

-- 6. Unique constraint to prevent duplicate follows
CREATE UNIQUE INDEX idx_ticket_followers_user
ON public.ticket_followers (ticket_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_ticket_followers_email
ON public.ticket_followers (ticket_id, follower_email)
WHERE follower_email IS NOT NULL;
