-- Add tags column to automated_test_catalog
ALTER TABLE automated_test_catalog ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create tag_groups table for configurable tag suggestions
CREATE TABLE IF NOT EXISTS tag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  color text DEFAULT 'blue',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tag_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_tag_groups" ON tag_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_tag_groups" ON tag_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_tag_groups" ON tag_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_tag_groups" ON tag_groups FOR DELETE TO authenticated USING (true);

-- Insert some default tag groups as examples
INSERT INTO tag_groups (name, description, tags, color, sort_order) VALUES
  ('Smoke tests', 'Tests de fumée - validation rapide des parcours critiques', ARRAY['smoke', 'critical'], 'red', 1),
  ('Regression CC', 'Régression Circuit Court', ARRAY['CC', 'regression'], 'green', 2),
  ('Regression CL', 'Régression Circuit Long Web', ARRAY['CL web', 'CEASY x Essentiel', 'regression'], 'blue', 3),
  ('Partenaires FNAC/Darty', 'Tests spécifiques FNAC et Darty', ARRAY['fnac', 'darty'], 'orange', 4),
  ('Sprint validation', 'Validation de sprint', ARRAY['sprint', 'validation'], 'purple', 5)
ON CONFLICT DO NOTHING;
