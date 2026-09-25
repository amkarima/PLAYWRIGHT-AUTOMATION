/*
# Create test_folders table and link automated_test_catalog to folders

1. New Tables
  - `test_folders`
    - `id` (uuid, primary key)
    - `name` (text, not null) — folder display name
    - `parent_id` (uuid, nullable, self-reference) — null = root folder
    - `sort_order` (integer, default 0) — ordering among siblings
    - `color` (text, nullable) — optional accent color (e.g. 'blue', 'green')
    - `icon` (text, nullable) — optional lucide icon name
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

2. Modified Tables
  - `automated_test_catalog`: add `folder_id` (uuid, nullable) referencing `test_folders(id)` ON DELETE SET NULL.

3. Security
  - RLS enabled on `test_folders`, anon + authenticated CRUD (single-tenant, no sign-in).

4. Notes
  - Deleting a folder sets its tests to folder_id = null (tests preserved).
*/

CREATE TABLE IF NOT EXISTS test_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES test_folders(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  color text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE test_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read folders" ON test_folders;
CREATE POLICY "Anyone can read folders"
  ON test_folders FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert folders" ON test_folders;
CREATE POLICY "Anyone can insert folders"
  ON test_folders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update folders" ON test_folders;
CREATE POLICY "Anyone can update folders"
  ON test_folders FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete folders" ON test_folders;
CREATE POLICY "Anyone can delete folders"
  ON test_folders FOR DELETE
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automated_test_catalog'
    AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE automated_test_catalog ADD COLUMN folder_id uuid REFERENCES test_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Default root folders
INSERT INTO test_folders (name, parent_id, sort_order, color)
SELECT v.name, NULL::uuid, v.sort_order, v.color
FROM (VALUES
  ('Sofinco', 1, 'blue'),
  ('Darty', 2, 'red'),
  ('FNAC', 3, 'purple'),
  ('IKEA', 4, 'amber'),
  ('Printemps', 5, 'pink'),
  ('La Redoute', 6, 'green')
) AS v(name, sort_order, color)
WHERE NOT EXISTS (SELECT 1 FROM test_folders LIMIT 1);

-- Assign existing tests by partner
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'Sofinco' LIMIT 1)
  WHERE partner = 'sofinco' AND folder_id IS NULL;
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'Darty' LIMIT 1)
  WHERE partner = 'darty' AND folder_id IS NULL;
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'FNAC' LIMIT 1)
  WHERE partner = 'fnac' AND folder_id IS NULL;
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'IKEA' LIMIT 1)
  WHERE partner = 'ikea' AND folder_id IS NULL;
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'Printemps' LIMIT 1)
  WHERE partner = 'printemps' AND folder_id IS NULL;
UPDATE automated_test_catalog SET folder_id = (SELECT id FROM test_folders WHERE name = 'La Redoute' LIMIT 1)
  WHERE partner = 'redoute' AND folder_id IS NULL;
