-- Add progress_logs column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS progress_logs jsonb[] DEFAULT '{}'::jsonb[];

-- Add progress column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;