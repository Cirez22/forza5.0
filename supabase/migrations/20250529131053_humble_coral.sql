-- Create project_invitations table
CREATE TABLE project_invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    invited_email text NOT NULL,
    invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations for their email"
    ON project_invitations FOR SELECT
    TO authenticated
    USING (
        invited_email = auth.jwt()->>'email' OR
        invited_by = auth.uid() OR
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invitations for their projects"
    ON project_invitations FOR INSERT
    TO authenticated
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their received invitations"
    ON project_invitations FOR UPDATE
    TO authenticated
    USING (invited_email = auth.jwt()->>'email')
    WITH CHECK (invited_email = auth.jwt()->>'email');

-- Add trigger to update project_members when invitation is accepted
CREATE OR REPLACE FUNCTION handle_project_invitation_response()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Get the user_id for the invited email
        WITH user_id_query AS (
            SELECT id 
            FROM auth.users 
            WHERE email = NEW.invited_email
            LIMIT 1
        )
        INSERT INTO project_members (project_id, user_id)
        SELECT NEW.project_id, id
        FROM user_id_query
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_invitation_response
    AFTER UPDATE ON project_invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_invitation_response();