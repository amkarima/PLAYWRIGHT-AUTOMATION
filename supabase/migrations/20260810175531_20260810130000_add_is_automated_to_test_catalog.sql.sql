ALTER TABLE automated_test_catalog
  ADD COLUMN IF NOT EXISTS is_automated boolean DEFAULT false;