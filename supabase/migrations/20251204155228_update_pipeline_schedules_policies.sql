/*
  # Update pipeline_schedules policies for anonymous access

  ## Overview
  This migration updates the Row Level Security policies for the pipeline_schedules table
  to allow anonymous access for all operations. This is necessary because the application
  does not use authentication.

  ## Changes
  
  1. Drop existing restrictive policies
  2. Create new permissive policies that allow anonymous access
  
  ## Security Notes
  
  - These policies allow full anonymous access to the pipeline_schedules table
  - This is acceptable for internal tools where authentication is not required
  - If authentication is added in the future, these policies should be updated
*/

DROP POLICY IF EXISTS "Anyone can view pipeline schedules" ON pipeline_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert pipeline schedules" ON pipeline_schedules;
DROP POLICY IF EXISTS "Authenticated users can update pipeline schedules" ON pipeline_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete pipeline schedules" ON pipeline_schedules;

CREATE POLICY "Allow anonymous SELECT on pipeline_schedules"
  ON pipeline_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous INSERT on pipeline_schedules"
  ON pipeline_schedules
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous UPDATE on pipeline_schedules"
  ON pipeline_schedules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous DELETE on pipeline_schedules"
  ON pipeline_schedules
  FOR DELETE
  USING (true);
