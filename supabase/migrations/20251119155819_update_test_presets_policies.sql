/*
  # Update test presets policies for public access

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Add new policies that allow anyone to insert, update, and delete presets
    - Keep read policy as public

  2. Security Notes
    - This allows public modification of test presets
    - Suitable for internal testing tools without authentication
    - If this is a production app, authentication should be added
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert test presets" ON test_presets;
DROP POLICY IF EXISTS "Authenticated users can update test presets" ON test_presets;
DROP POLICY IF EXISTS "Authenticated users can delete test presets" ON test_presets;

-- Create new public policies
CREATE POLICY "Anyone can insert test presets"
  ON test_presets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update test presets"
  ON test_presets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete test presets"
  ON test_presets FOR DELETE
  USING (true);
