/*
  # Add clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `clients` table
    - Add policies for:
      - SELECT: Users can view their own clients
      - INSERT: Users can create their own clients
      - UPDATE: Users can update their own clients
      - DELETE: Users can delete their own clients
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own clients"
    ON public.clients FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own clients"
    ON public.clients FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own clients"
    ON public.clients FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own clients"
    ON public.clients FOR DELETE
    USING (auth.uid() = owner_id);

-- Create index for faster lookups by owner_id
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON public.clients(owner_id);