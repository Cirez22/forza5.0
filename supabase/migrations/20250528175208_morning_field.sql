-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES auth.users(id),
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    file_kind file_kind DEFAULT 'other'::file_kind,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view files of their projects"
    ON project_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their projects"
    ON project_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files from their projects"
    ON project_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload project files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-files' 
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their project files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'project-files'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their project files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'project-files'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can download their project files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'project-files'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM projects WHERE owner_id = auth.uid()
        )
    );