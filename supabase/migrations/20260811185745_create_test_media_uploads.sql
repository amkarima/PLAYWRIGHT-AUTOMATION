/*
  # Create test media uploads table + storage bucket

  1. New Tables
    - `test_media_uploads`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, FK to test_failure_analyses, ON DELETE CASCADE)
      - `pipeline_id` (integer) - GitLab pipeline ID (for queries without analysis)
      - `job_id` (integer) - GitLab job ID
      - `test_key` (text) - test identifier
      - `file_name` (text) - original file name
      - `file_path` (text) - path in storage bucket
      - `media_type` (text) - 'image' or 'video'
      - `mime_type` (text) - actual MIME type
      - `file_size` (bigint) - size in bytes
      - `uploaded_by` (text) - uploader name
      - `created_at` (timestamptz)

  2. Storage
    - Create bucket `test-media-uploads` (public read)
    - Policies: anon/authenticated can read, upload, delete

  3. Security
    - RLS enabled on test_media_uploads
    - Public CRUD (no auth app) TO anon, authenticated
*/

CREATE TABLE IF NOT EXISTS test_media_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES test_failure_analyses(id) ON DELETE CASCADE,
  pipeline_id integer NOT NULL,
  job_id integer NOT NULL,
  test_key text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  mime_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by text DEFAULT 'anonymous',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_media_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_test_media" ON test_media_uploads;
CREATE POLICY "anon_select_test_media" ON test_media_uploads
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_test_media" ON test_media_uploads;
CREATE POLICY "anon_insert_test_media" ON test_media_uploads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_test_media" ON test_media_uploads;
CREATE POLICY "anon_update_test_media" ON test_media_uploads
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_test_media" ON test_media_uploads;
CREATE POLICY "anon_delete_test_media" ON test_media_uploads
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_test_media_uploads_job_test
  ON test_media_uploads(job_id, test_key);

INSERT INTO storage.buckets (id, name, public)
VALUES ('test-media-uploads', 'test-media-uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_test_media_bucket" ON storage.objects;
CREATE POLICY "anon_read_test_media_bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'test-media-uploads');

DROP POLICY IF EXISTS "anon_insert_test_media_bucket" ON storage.objects;
CREATE POLICY "anon_insert_test_media_bucket" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'test-media-uploads');

DROP POLICY IF EXISTS "anon_delete_test_media_bucket" ON storage.objects;
CREATE POLICY "anon_delete_test_media_bucket" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'test-media-uploads');
