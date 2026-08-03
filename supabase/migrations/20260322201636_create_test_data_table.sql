/*
  # Create test_data table for QA team data sharing

  ## Description
  This migration creates a table to store various types of test data that the QA team needs to share,
  such as test credentials, identity documents, and other test data.

  ## New Tables
  - `test_data`
    - `id` (uuid, primary key) - Unique identifier for each data entry
    - `category` (text) - Category of test data (e.g., 'identifiants', 'piece_identite', 'cartes_bancaires', 'adresses', 'autre')
    - `title` (text) - Title/name of the test data entry
    - `description` (text, optional) - Detailed description of the test data
    - `data_content` (jsonb) - The actual test data stored as JSON for flexibility
    - `tags` (text array, optional) - Tags for easy filtering and searching
    - `created_by` (text, optional) - Name or identifier of the person who created this entry
    - `created_at` (timestamptz) - Timestamp when the entry was created
    - `updated_at` (timestamptz) - Timestamp when the entry was last updated

  ## Security
  - Enable RLS on `test_data` table
  - Add policy for anonymous users to read all test data (since this is internal QA data)
  - Add policy for anonymous users to insert test data
  - Add policy for anonymous users to update test data
  - Add policy for anonymous users to delete test data
  
  Note: Using anonymous access since this is an internal QA tool for team collaboration
*/

CREATE TABLE IF NOT EXISTS test_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  data_content jsonb NOT NULL,
  tags text[],
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE test_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test data"
  ON test_data
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert test data"
  ON test_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update test data"
  ON test_data
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete test data"
  ON test_data
  FOR DELETE
  TO anon
  USING (true);

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_test_data_category ON test_data(category);

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_test_data_tags ON test_data USING gin(tags);