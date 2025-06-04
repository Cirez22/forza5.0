/*
  # Add foreign key constraint for project-client relationship

  1. Changes
    - Add foreign key constraint from projects.client_id to clients.id
    - Add index on projects.client_id for better query performance

  2. Security
    - No changes to RLS policies required
*/

-- Add foreign key constraint
ALTER TABLE projects
ADD CONSTRAINT projects_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE SET NULL;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id
ON projects(client_id);