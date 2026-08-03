-- Create Automated Test Presets Table
--
-- 1. New Tables
--    - automated_test_presets
--      - id (uuid, primary key) - Unique identifier
--      - name (text, not null) - Name of the preset
--      - description (text) - Description of the preset
--      - test_keys (text array) - Array of test keys to run
--      - variables (jsonb) - Variables to pass to the pipeline
--      - e_signature (boolean, default false) - Enable e-signature
--      - created_at (timestamptz, default now())
--      - updated_at (timestamptz, default now())
--      - created_by (text) - Username who created the preset
--
-- 2. Security
--    - Enable RLS on automated_test_presets table
--    - Add policy for authenticated users to read all presets
--    - Add policy for authenticated users to create presets
--    - Add policy for authenticated users to update presets
--    - Add policy for authenticated users to delete presets
--
-- 3. Indexes
--    - Create index on name column for faster searching
--    - Create index on created_at column for sorting

CREATE TABLE IF NOT EXISTS automated_test_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  test_keys text[] DEFAULT '{}',
  variables jsonb DEFAULT '{}',
  e_signature boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE automated_test_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all automated test presets"
  ON automated_test_presets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create automated test presets"
  ON automated_test_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update automated test presets"
  ON automated_test_presets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete automated test presets"
  ON automated_test_presets
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_automated_test_presets_name ON automated_test_presets(name);
CREATE INDEX IF NOT EXISTS idx_automated_test_presets_created_at ON automated_test_presets(created_at DESC);