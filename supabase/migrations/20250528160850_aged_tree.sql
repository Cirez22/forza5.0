/*
  # Add missing columns to projects table

  1. Changes
    - Add missing columns to projects table:
      - `address` (text, nullable)
      - `description` (text, nullable)
      - `end_date` (date, nullable)
      - `project_type` (text, nullable) - renamed from type for clarity
      - `value` (numeric(12,2), nullable)

  2. Notes
    - All columns are made nullable to maintain compatibility with existing data
    - Using DO block to safely add columns only if they don't exist
    - Renamed 'type' to 'project_type' to avoid reserved word conflicts
*/

DO $$
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'address'
  ) THEN
    ALTER TABLE projects ADD COLUMN address text;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'description'
  ) THEN
    ALTER TABLE projects ADD COLUMN description text;
  END IF;

  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN end_date date;
  END IF;

  -- Add project_type column if it doesn't exist (renamed from type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type text;
  END IF;

  -- Add value column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'value'
  ) THEN
    ALTER TABLE projects ADD COLUMN value numeric(12,2);
  END IF;
END $$;