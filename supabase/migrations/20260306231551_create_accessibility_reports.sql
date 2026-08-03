/*
  # Create accessibility reports table

  1. New Tables
    - `accessibility_reports`
      - `id` (uuid, primary key)
      - `title` (text) - Report title/name
      - `url` (text) - BrowserStack report URL
      - `description` (text, optional) - Report description
      - `test_date` (date) - Date when the test was conducted
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `accessibility_reports` table
    - Add policy for anonymous users to read reports (public access)
    - Add policy for authenticated users to manage reports
*/

CREATE TABLE IF NOT EXISTS accessibility_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text DEFAULT '',
  test_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accessibility_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view accessibility reports
CREATE POLICY "Anyone can view accessibility reports"
  ON accessibility_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to insert reports
CREATE POLICY "Authenticated users can insert accessibility reports"
  ON accessibility_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update reports
CREATE POLICY "Authenticated users can update accessibility reports"
  ON accessibility_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete reports
CREATE POLICY "Authenticated users can delete accessibility reports"
  ON accessibility_reports
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accessibility_reports_test_date 
  ON accessibility_reports(test_date DESC);