/*
  # Create automated test catalog table

  1. New Tables
    - `automated_test_catalog`
      - `id` (text, primary key) - Test ID (e.g., 'SOF-148667')
      - `name` (text) - Test name/description
      - `test_type` (text) - Type of test (e.g., 'CC', 'CL web', 'CEASY x Essentiel')
      - `partner` (text) - Partner name (e.g., 'sofinco', 'darty', 'fnac')
      - `is_active` (boolean) - Whether the test is active and should appear in the list
      - `sort_order` (integer) - Order in which tests should be displayed
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `automated_test_catalog` table
    - Add policy for authenticated users to read active tests
    - Add policy for authenticated users to manage all tests (for admin UI)
*/

CREATE TABLE IF NOT EXISTS automated_test_catalog (
  id text PRIMARY KEY,
  name text NOT NULL,
  test_type text NOT NULL,
  partner text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automated_test_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read active tests"
  ON automated_test_catalog
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read all tests"
  ON automated_test_catalog
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert tests"
  ON automated_test_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tests"
  ON automated_test_catalog
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete tests"
  ON automated_test_catalog
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert existing tests as initial data
INSERT INTO automated_test_catalog (id, name, test_type, partner, is_active, sort_order) VALUES
  ('SOF-148667', 'CR < 3000€ prospect', 'CC', 'sofinco', true, 1),
  ('SOF-149125', 'PB > 3000€ prospect', 'CC', 'sofinco', true, 2),
  ('SOF-148815', 'CR > 3000€ prospect', 'CC', 'sofinco', true, 3),
  ('SOF-150935', 'DARTY - CRA < 3000€ prospect', 'CL web', 'darty', true, 4),
  ('SOF-155831', 'DARTY - CRS < 3000€ prospect', 'CL web', 'darty', true, 5),
  ('SOF-155841', 'FNAC - CRS < 3000€ prospect', 'CL web', 'fnac', true, 6),
  ('SOF-155838', 'IKEA - CRS < 3000€ prospect', 'CL web', 'ikea', true, 7),
  ('SOF-160001', 'PRINTEMPS - CRS < 3000€ prospect', 'CL web', 'printemps', true, 8),
  ('SOF-160002', 'PRINTEMPS - CRA > 3000€ prospect', 'CEASY x Essentiel', 'printemps', true, 9),
  ('SOF-160003', 'LA REDOUTE - CRS < 3000€ prospect', 'CL web', 'redoute', true, 10),
  ('SOF-160004', 'LA REDOUTE - CRA > 3000€ prospect', 'CEASY x Essentiel', 'redoute', true, 11),
  ('SOF-150939', 'DARTY - CRA > 3000€ prospect', 'CEASY x Essentiel', 'darty', true, 12),
  ('SOF-150936', 'FNAC - CRA > 3000€ prospect', 'CEASY x Essentiel', 'fnac', true, 13)
ON CONFLICT (id) DO NOTHING;