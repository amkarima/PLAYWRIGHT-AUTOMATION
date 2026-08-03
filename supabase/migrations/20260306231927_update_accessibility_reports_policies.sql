/*
  # Update accessibility reports policies for anonymous access

  1. Changes
    - Drop existing restrictive policies
    - Add new policies allowing anonymous (anon) users full CRUD access
    - This allows the application to manage reports without authentication

  2. Security Notes
    - All users (anonymous and authenticated) can perform all operations
    - This is appropriate for internal tools without user authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view accessibility reports" ON accessibility_reports;
DROP POLICY IF EXISTS "Authenticated users can insert accessibility reports" ON accessibility_reports;
DROP POLICY IF EXISTS "Authenticated users can update accessibility reports" ON accessibility_reports;
DROP POLICY IF EXISTS "Authenticated users can delete accessibility reports" ON accessibility_reports;

-- Allow anonymous users to view reports
CREATE POLICY "Anyone can view accessibility reports"
  ON accessibility_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to insert reports
CREATE POLICY "Anyone can insert accessibility reports"
  ON accessibility_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update reports
CREATE POLICY "Anyone can update accessibility reports"
  ON accessibility_reports
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete reports
CREATE POLICY "Anyone can delete accessibility reports"
  ON accessibility_reports
  FOR DELETE
  TO anon, authenticated
  USING (true);