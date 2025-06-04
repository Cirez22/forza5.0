/*
  # Fix forum posts user relationship

  1. Changes
    - Update foreign key constraint for forum_posts.user_id to reference auth.users table
    - This fixes the "Could not find a relationship" error when querying posts with user data

  2. Security
    - No changes to RLS policies
*/

-- First remove the existing foreign key if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'forum_posts_user_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'forum_posts'
  ) THEN
    ALTER TABLE forum_posts DROP CONSTRAINT forum_posts_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE forum_posts
ADD CONSTRAINT forum_posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);