-- Add a column to memberships to track if user can validate user requests
ALTER TABLE public.memberships 
ADD COLUMN can_validate_user_requests boolean NOT NULL DEFAULT false;