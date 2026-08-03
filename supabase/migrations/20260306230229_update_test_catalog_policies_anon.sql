/*
  # Update automated_test_catalog policies for anonymous access

  1. Changes
    - Drop existing policies that require authentication
    - Add new policies that allow anonymous access for internal applications
    
  2. Security
    - Allow anonymous users to read all tests (for viewing and selection)
    - Allow anonymous users to manage tests (for admin interface)
    - This is appropriate for internal dashboards without user authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read active tests" ON automated_test_catalog;
DROP POLICY IF EXISTS "Users can read all tests" ON automated_test_catalog;
DROP POLICY IF EXISTS "Users can insert tests" ON automated_test_catalog;
DROP POLICY IF EXISTS "Users can update tests" ON automated_test_catalog;
DROP POLICY IF EXISTS "Users can delete tests" ON automated_test_catalog;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can read all tests"
  ON automated_test_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert tests"
  ON automated_test_catalog
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update tests"
  ON automated_test_catalog
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tests"
  ON automated_test_catalog
  FOR DELETE
  TO anon, authenticated
  USING (true);