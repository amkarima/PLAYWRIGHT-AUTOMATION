/*
  # Create test failure analyses table

  1. New Tables
    - `test_failure_analyses`
      - `id` (uuid, primary key) - Unique identifier for the analysis
      - `pipeline_id` (integer) - ID of the GitLab pipeline
      - `job_id` (integer) - ID of the GitLab job
      - `test_key` (text) - Unique key identifying the test (e.g., suite-spec-test indices)
      - `test_title` (text) - Title of the test for display
      - `test_file` (text) - File path of the test
      - `root_cause` (text) - Root cause of the failure
      - `analysis` (text) - Detailed analysis of the failure
      - `created_at` (timestamptz) - When the analysis was created
      - `updated_at` (timestamptz) - When the analysis was last updated
      - `created_by` (text) - User who created the analysis

  2. Security
    - Enable RLS on `test_failure_analyses` table
    - Add policy for anyone to read analyses (public read)
    - Add policy for anyone to insert/update analyses (public write for now)

  3. Indexes
    - Index on `pipeline_id` for faster lookups
    - Index on `job_id` for faster lookups
    - Unique index on combination of `job_id` and `test_key` to prevent duplicates
*/

-- Create the test_failure_analyses table
CREATE TABLE IF NOT EXISTS test_failure_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id integer NOT NULL,
  job_id integer NOT NULL,
  test_key text NOT NULL,
  test_title text NOT NULL,
  test_file text NOT NULL,
  root_cause text NOT NULL DEFAULT '',
  analysis text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'anonymous'
);

-- Enable Row Level Security
ALTER TABLE test_failure_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can read)
CREATE POLICY "Anyone can view test failure analyses"
  ON test_failure_analyses
  FOR SELECT
  USING (true);

-- Create policies for public write (anyone can insert)
CREATE POLICY "Anyone can create test failure analyses"
  ON test_failure_analyses
  FOR INSERT
  WITH CHECK (true);

-- Create policies for public update (anyone can update)
CREATE POLICY "Anyone can update test failure analyses"
  ON test_failure_analyses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policies for public delete (anyone can delete)
CREATE POLICY "Anyone can delete test failure analyses"
  ON test_failure_analyses
  FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_failure_analyses_pipeline_id
  ON test_failure_analyses(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_test_failure_analyses_job_id
  ON test_failure_analyses(job_id);

-- Create unique index to prevent duplicate analyses for the same test in the same job
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_failure_analyses_job_test_unique
  ON test_failure_analyses(job_id, test_key);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_failure_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_test_failure_analyses_updated_at ON test_failure_analyses;
CREATE TRIGGER trigger_update_test_failure_analyses_updated_at
  BEFORE UPDATE ON test_failure_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_test_failure_analyses_updated_at();