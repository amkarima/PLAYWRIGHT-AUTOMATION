ALTER TABLE automated_test_catalog
  ADD COLUMN IF NOT EXISTS preset_id uuid REFERENCES test_presets(id) ON DELETE SET NULL;