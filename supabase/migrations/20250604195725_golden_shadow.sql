/*
  # Add Global Discount Table

  1. New Tables
    - `global_discount`
      - `id` (uuid, primary key)
      - `percentage` (numeric(5,2), not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `active` (boolean)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create global_discount table
CREATE TABLE IF NOT EXISTS global_discount (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    percentage numeric(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE global_discount ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage global discount"
    ON global_discount
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
    )
    WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_global_discount_updated_at
    BEFORE UPDATE ON global_discount
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial discount (0%)
INSERT INTO global_discount (percentage, active)
VALUES (0, true)
ON CONFLICT DO NOTHING;