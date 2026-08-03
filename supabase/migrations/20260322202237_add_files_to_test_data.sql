/*
  # Add file support to test_data table

  ## Description
  This migration adds support for file attachments to the test_data table by:
  - Adding a new column to store file information (path, name, size, type)
  - Creating a storage bucket for JDD files
  - Setting up storage policies for file access

  ## Changes
  1. Add `file_info` column to `test_data` table
     - `file_info` (jsonb, optional) - Stores file metadata (path, name, size, type)
  
  2. Create storage bucket `jdd-files`
     - Public bucket for easy access by QA team
  
  3. Security
     - Storage policies to allow read/write access for anonymous users (internal QA tool)
*/

-- Add file_info column to test_data table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_data' AND column_name = 'file_info'
  ) THEN
    ALTER TABLE test_data ADD COLUMN file_info jsonb;
  END IF;
END $$;

-- Create storage bucket for JDD files
INSERT INTO storage.buckets (id, name, public)
VALUES ('jdd-files', 'jdd-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload files to jdd-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read files from jdd-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update files in jdd-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete files from jdd-files" ON storage.objects;

-- Storage policies for anonymous users to upload files
CREATE POLICY "Anyone can upload files to jdd-files"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'jdd-files');

CREATE POLICY "Anyone can read files from jdd-files"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'jdd-files');

CREATE POLICY "Anyone can update files in jdd-files"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'jdd-files')
  WITH CHECK (bucket_id = 'jdd-files');

CREATE POLICY "Anyone can delete files from jdd-files"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'jdd-files');