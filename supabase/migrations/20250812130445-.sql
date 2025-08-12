-- Fix the foreign key relationship between role_requests and profiles
ALTER TABLE role_requests 
DROP CONSTRAINT IF EXISTS role_requests_user_id_fkey;

ALTER TABLE role_requests 
ADD CONSTRAINT role_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);