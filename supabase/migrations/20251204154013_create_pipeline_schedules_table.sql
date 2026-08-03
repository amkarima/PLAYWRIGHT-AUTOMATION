/*
  # Create pipeline_schedules table

  ## Overview
  This migration creates a table to store GitLab pipeline scheduling information,
  allowing users to view existing pipeline schedules and create new ones.

  ## New Tables
  
  ### `pipeline_schedules`
  Table to store pipeline schedule configurations
  
  - `id` (uuid, primary key) - Unique identifier for each schedule
  - `gitlab_schedule_id` (integer, nullable) - GitLab's schedule ID (null for pending schedules)
  - `description` (text) - Description of the schedule
  - `ref` (text) - Git branch or tag to run the pipeline on
  - `cron` (text) - Cron expression for schedule timing
  - `cron_timezone` (text) - Timezone for cron expression
  - `active` (boolean) - Whether the schedule is active
  - `variables` (jsonb) - Pipeline variables as key-value pairs
  - `created_by` (text) - Name or identifier of who created the schedule
  - `created_at` (timestamptz) - When the schedule was created
  - `updated_at` (timestamptz) - When the schedule was last updated
  - `last_pipeline_id` (integer, nullable) - Last pipeline ID triggered by this schedule
  - `last_pipeline_status` (text, nullable) - Status of the last triggered pipeline

  ## Security
  
  1. Enable RLS on the `pipeline_schedules` table
  2. Add policy for authenticated users to read all schedules
  3. Add policy for authenticated users to insert schedules
  4. Add policy for authenticated users to update schedules
  5. Add policy for authenticated users to delete schedules

  ## Notes
  
  - The `gitlab_schedule_id` is nullable to support schedules that are created locally but not yet synced to GitLab
  - The `variables` field uses JSONB for flexible storage of pipeline variables
  - The `cron` field stores standard cron expressions (e.g., "0 2 * * *" for daily at 2 AM)
  - Default timezone is UTC
*/

CREATE TABLE IF NOT EXISTS pipeline_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gitlab_schedule_id integer UNIQUE,
  description text NOT NULL,
  ref text NOT NULL DEFAULT 'main',
  cron text NOT NULL,
  cron_timezone text NOT NULL DEFAULT 'UTC',
  active boolean NOT NULL DEFAULT true,
  variables jsonb DEFAULT '{}'::jsonb,
  created_by text NOT NULL DEFAULT 'anonymous',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_pipeline_id integer,
  last_pipeline_status text
);

ALTER TABLE pipeline_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pipeline schedules"
  ON pipeline_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pipeline schedules"
  ON pipeline_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pipeline schedules"
  ON pipeline_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pipeline schedules"
  ON pipeline_schedules
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_gitlab_id ON pipeline_schedules(gitlab_schedule_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_active ON pipeline_schedules(active);
CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_created_at ON pipeline_schedules(created_at DESC);
