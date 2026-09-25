/*
  # Store full accessibility report data and images on the server

  1. Changes to existing tables
    - `accessibility_reports`
      - ADD `report_data` (jsonb, nullable) — full axe-core JSON report (violations, passes, nodes, screenshots references, etc.)
      - ADD `image_paths` (jsonb, nullable) — array of storage paths for associated screenshot images
      - ADD `status` (text, default 'success') — 'success' or 'failed' depending on violation count
      - ADD `standard` (text, default 'wcag21aa') — WCAG standard used for the test

  2. Storage
    - Create a public storage bucket `accessibility-images` for screenshot uploads.
    - Public read is enabled so the frontend can display images via their public URL.
    - Allow anon + authenticated to upload, read, and manage images.

  3. Security
    - No new tables created. Existing RLS policies on `accessibility_reports` already allow
      anon + authenticated full CRUD (appropriate for internal tool without auth).
    - Storage bucket policies allow anon + authenticated to read and write objects.

  4. Notes
    - `report_data` stores the entire JSON so reports can be fully reconstructed from the server.
    - `image_paths` stores the Supabase storage paths (e.g. `accessibility-images/<report-id>/<filename>.png`)
      so the frontend can build public URLs and map screenshots to their images.
*/

-- Add columns for full report persistence
ALTER TABLE accessibility_reports
  ADD COLUMN IF NOT EXISTS report_data jsonb,
  ADD COLUMN IF NOT EXISTS image_paths jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS standard text DEFAULT 'wcag21aa';

-- Create storage bucket for accessibility screenshot images
INSERT INTO storage.buckets (id, name, public)
VALUES ('accessibility-images', 'accessibility-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to read and write images
DROP POLICY IF EXISTS "Anyone can read accessibility images" ON storage.objects;
CREATE POLICY "Anyone can read accessibility images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'accessibility-images');

DROP POLICY IF EXISTS "Anyone can upload accessibility images" ON storage.objects;
CREATE POLICY "Anyone can upload accessibility images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'accessibility-images');

DROP POLICY IF EXISTS "Anyone can update accessibility images" ON storage.objects;
CREATE POLICY "Anyone can update accessibility images"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'accessibility-images')
  WITH CHECK (bucket_id = 'accessibility-images');

DROP POLICY IF EXISTS "Anyone can delete accessibility images" ON storage.objects;
CREATE POLICY "Anyone can delete accessibility images"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'accessibility-images');