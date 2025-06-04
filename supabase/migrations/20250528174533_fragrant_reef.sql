/*
  # Fix project RLS policies

  1. Changes
    - Add RLS policy for project creation
    - Add RLS policy for project updates
    - Add RLS policy for project deletion

  2. Security
    - Enable RLS on projects table
    - Add policies to allow users to manage their own projects
*/

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting projects
CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Create policy for updating projects
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Create policy for deleting projects
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);