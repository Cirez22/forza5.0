-- Update project policies to allow clients to view projects
CREATE POLICY "Clients can view projects they are assigned to"
ON projects FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
);

-- Update existing policies to handle both owners and clients
DROP POLICY IF EXISTS "Users can read projects they own or are members of" ON projects;

CREATE POLICY "Users can read projects they own or are members of"
ON projects FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT project_id 
    FROM project_members 
    WHERE user_id = auth.uid()
  ) OR
  client_id = auth.uid()
);

-- Only owners can update their projects
CREATE POLICY "Only owners can update their projects"
ON projects FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Only owners can delete their projects
CREATE POLICY "Only owners can delete their projects"
ON projects FOR DELETE
TO authenticated
USING (owner_id = auth.uid());