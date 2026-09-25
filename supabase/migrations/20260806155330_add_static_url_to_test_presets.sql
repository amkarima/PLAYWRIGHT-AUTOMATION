/*
# Add static_url to test_presets

1. Modified Tables
  - `test_presets`
    - Add `static_url` (text, nullable) — when set, the launcher uses this URL directly
      instead of calling the generate-test-url edge function. Lets you configure tests
      that run against a pre-existing/static URL (no dynamic generation needed).

2. Security
  - No policy changes. Existing RLS policies already cover the new column since they
    are table-scoped (SELECT public, INSERT/UPDATE/DELETE authenticated).
*/

ALTER TABLE test_presets
  ADD COLUMN IF NOT EXISTS static_url text;
