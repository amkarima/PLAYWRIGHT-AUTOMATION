/*
# Add gherkin_script column to automated_test_catalog

1. Modified Tables
- `automated_test_catalog`: add `gherkin_script` column (text, nullable) to store the full Gherkin test scenario.
2. Security
- No changes to existing RLS policies.
3. Notes
- The column is optional (nullable) so existing tests are not affected.
- The frontend Gherkin editor will read and write this column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automated_test_catalog'
    AND column_name = 'gherkin_script'
  ) THEN
    ALTER TABLE automated_test_catalog ADD COLUMN gherkin_script text;
  END IF;
END $$;
